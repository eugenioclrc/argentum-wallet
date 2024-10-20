function resumeIfSuspended(audioCtx) {
	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
}

function chunkBuffer(buffer, chunkSize) {
	const res = [];
	for (let i = 0; i < buffer.byteLength; i += chunkSize) {
		const frame = buffer.slice(i, i + chunkSize);
		res.push(frame);
	}
	return res;
}

const NullTerminator = '\0';

// export const encode = (str) => new TextEncoder().encode(str);

// TODO: Consolidate these

const encodeForTransmit = (str) => new TextEncoder().encode(str);

const encode = (str) => str.split('').map((x) => x.charCodeAt(0));

function allocateArrayOnStack(instance, arr) {
	const ret = instance.exports.stackAlloc(arr.length);
	const HEAP8 = new Int8Array(instance.exports.memory.buffer);
	HEAP8.set(arr, ret);
	return ret;
}

function allocateStringOnStack(instance, string) {
	return allocateArrayOnStack(instance, encode(string + NullTerminator));
}

function mallocArray(bufferSize, instance) {
	const pointer = instance.exports.malloc(4 * bufferSize);
	const HEAPF32 = new Float32Array(instance.exports.memory.buffer);
	const view = HEAPF32.subarray(pointer / 4, pointer / 4 + bufferSize);

	return {
		pointer,
		view
	};
}

const sampleBufferSize = 16384;

const waitUntil = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

class Transmitter {
	constructor(audioContext, instance) {
		this.destroyed = false;
		this.audioContext = audioContext;
		this.instance = instance;
	}

	selectProfile(profile, clampFrame) {
		const stack = this.instance.exports.stackSave();

		const cProfiles = allocateStringOnStack(this.instance, JSON.stringify({ profile }));
		const cProfile = allocateStringOnStack(this.instance, 'profile');

		const quietEncoderOptions = this.instance.exports.quiet_encoder_profile_str(
			cProfiles,
			cProfile
		);

		this.encoder = this.instance.exports.quiet_encoder_create(
			quietEncoderOptions,
			this.audioContext.sampleRate
		);

		this.instance.exports.free(quietEncoderOptions);

		this.frameLength = clampFrame
			? this.instance.exports.quiet_encoder_clamp_frame_len(this.encoder, sampleBufferSize)
			: this.instance.exports.quiet_encoder_get_frame_len(this.encoder);

		this.samples = mallocArray(sampleBufferSize, this.instance);

		this.instance.exports.stackRestore(stack);
		return this;
	}

	async transmit(buf) {
		const stack = this.instance.exports.stackSave();

		resumeIfSuspended(this.audioContext);

		const payload = chunkBuffer(buf, this.frameLength);

		let t = this.audioContext.currentTime;
		for (const frame of payload) {
			const framePointer = allocateArrayOnStack(this.instance, new Uint8Array(frame));
			this.instance.exports.quiet_encoder_send(this.encoder, framePointer, frame.byteLength);
			const written = this.instance.exports.quiet_encoder_emit(
				this.encoder,
				this.samples.pointer,
				sampleBufferSize
			);

			const audioBuffer = this.audioContext.createBuffer(1, written, this.audioContext.sampleRate);

			for (let i = written; i < sampleBufferSize; i += 1) {
				this.samples.view[i] = 0;
			}

			audioBuffer.copyToChannel(this.samples.view.slice(0, written), 0, 0);

			const audioBufferNode = new AudioBufferSourceNode(this.audioContext);
			audioBufferNode.buffer = audioBuffer;
			audioBufferNode.connect(this.audioContext.destination);
			audioBufferNode.start(t);
			t += audioBuffer.duration;
		}

		this.instance.exports.stackRestore(stack);
		await waitUntil(t - this.audioContext.currentTime);
		return this;
	}

	destroy() {
		if (!this.destroyed) {
			this.instance.exports.free(this.samples.pointer);
			this.instance.exports.quiet_encoder_destroy(this.encoder);
			this.destroyed = true;
		}
		return this;
	}
}

var importObject = {
	env: {
		__sys_getpid: () => null
	},
	wasi_snapshot_preview1: {
		proc_exit: () => null,
		clock_time_get: () => null,
		fd_close: () => null,
		fd_write: () => null,
		fd_seek: () => null,
		fd_read: () => null
	}
};

const getUserAudio = () =>
	navigator.mediaDevices.getUserMedia({
		audio: {
			echoCancellation: false
		}
	});

class Quiet {
	constructor(audioContext, profile) {
		this.audioContext = audioContext;
		this.profile = profile;
	}

	async init() {
		const { module, instance } = await WebAssembly.instantiateStreaming(
			fetch(new URL('./quiet.wasm', import.meta.url)),
			importObject
		);

		this.instance = instance;

		if (typeof window !== 'undefined') {
			const { audioWorklet } = this.audioContext;
			await audioWorklet.addModule(new URL('./quiet.worklet.js', import.meta.url));

			this.quietProcessorNode = new AudioWorkletNode(this.audioContext, 'quiet-receiver-worklet', {
				processorOptions: {
					quietModule: module,
					profile: this.profile,
					sampleRate: this.audioContext.sampleRate
				}
			});
		}

		return this;
	}

	async transmit({ payload, clampFrame }) {
		(
			await new Transmitter(this.audioContext, this.instance)
				.selectProfile(this.profile, clampFrame)
				.transmit(encodeForTransmit(payload))
		).destroy();
	}

	async receive(onReceive) {
		this.audioStream = await getUserAudio();
		const audioInput = this.audioContext.createMediaStreamSource(this.audioStream);
		audioInput.connect(this.quietProcessorNode).port.onmessage = (e) => onReceive(e.data);
		resumeIfSuspended(this.audioContext);
	}
}

export default Quiet;
