const NullTerminator = '\0';

const encode = (str) => str.split('').map((x) => x.charCodeAt(0));

const decode = (buf) => [...new Uint8Array(buf)].map((x) => String.fromCharCode(x)).join('');

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

/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

// Original Source: https://github.com/GoogleChromeLabs/web-audio-samples/blob/main/audio-worklet/design-pattern/lib/wasm-audio-helper.js

/**
 * A JS FIFO implementation for the AudioWorklet. 3 assumptions for the
 * simpler operation:
 *  1. the push and the pull operation are done by 128 frames. (Web Audio
 *    API's render quantum size in the speficiation)
 *  2. the channel count of input/output cannot be changed dynamically.
 *    The AudioWorkletNode should be configured with the `.channelCount = k`
 *    (where k is the channel count you want) and
 *    `.channelCountMode = explicit`.
 *  3. This is for the single-thread operation. (obviously)
 *
 * @class
 */
class RingBuffer {
	/**
	 * @constructor
	 * @param  {number} length Buffer length in frames.
	 * @param  {number} channelCount Buffer channel count.
	 */
	constructor(length, channelCount) {
		this._readIndex = 0;
		this._writeIndex = 0;
		this._framesAvailable = 0;

		this._channelCount = channelCount;
		this._length = length;
		this._channelData = [];
		for (let i = 0; i < this._channelCount; i += 1) {
			this._channelData[i] = new Float32Array(length);
		}
	}

	/**
	 * Getter for Available frames in buffer.
	 *
	 * @return {number} Available frames in buffer.
	 */
	get framesAvailable() {
		return this._framesAvailable;
	}

	/**
	 * Push a sequence of Float32Arrays to buffer.
	 *
	 * @param  {array} arraySequence A sequence of Float32Arrays.
	 */
	push(arraySequence) {
		// The channel count of arraySequence and the length of each channel must
		// match with this buffer obejct.

		// Transfer data from the |arraySequence| storage to the internal buffer.
		const sourceLength = arraySequence[0].length;
		for (let i = 0; i < sourceLength; i += 1) {
			const writeIndex = (this._writeIndex + i) % this._length;
			for (let channel = 0; channel < this._channelCount; channel += 1) {
				this._channelData[channel][writeIndex] = arraySequence[channel][i];
			}
		}

		this._writeIndex += sourceLength;
		if (this._writeIndex >= this._length) {
			this._writeIndex = 0;
		}

		// For excessive frames, the buffer will be overwritten.
		this._framesAvailable += sourceLength;
		if (this._framesAvailable > this._length) {
			this._framesAvailable = this._length;
		}
	}

	/**
	 * Pull data out of buffer and fill a given sequence of Float32Arrays.
	 *
	 * @param  {array} arraySequence An array of Float32Arrays.
	 */
	pull(arraySequence) {
		// The channel count of arraySequence and the length of each channel must
		// match with this buffer obejct.

		// If the FIFO is completely empty, do nothing.
		if (this._framesAvailable === 0) {
			return;
		}

		const destinationLength = arraySequence[0].length;

		// Transfer data from the internal buffer to the |arraySequence| storage.
		for (let i = 0; i < destinationLength; i += 1) {
			const readIndex = (this._readIndex + i) % this._length;
			for (let channel = 0; channel < this._channelCount; channel += 1) {
				arraySequence[channel][i] = this._channelData[channel][readIndex];
			}
		}

		this._readIndex += destinationLength;
		if (this._readIndex >= this._length) {
			this._readIndex = 0;
		}

		this._framesAvailable -= destinationLength;
		if (this._framesAvailable < 0) {
			this._framesAvailable = 0;
		}
	}
} // class RingBuffer

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

/* eslint-disable no-param-reassign */

const sampleBufferSize = 16384;

class ReceiverWorklet extends AudioWorkletProcessor {
	constructor(options) {
		super();
		const { quietModule, profile, sampleRate } = options.processorOptions;
		this.quietModule = quietModule;
		this.profile = profile;
		this.sampleRate = sampleRate;
		this.inputRingBuffer = new RingBuffer(sampleBufferSize, 1);
		this.init();
	}

	async init() {
		this.instance = await WebAssembly.instantiate(this.quietModule, importObject);
		await this.selectProfile(this.instance, this.profile);
		return this;
	}

	async selectProfile(instance, profile) {
		const stack = instance.exports.stackSave();

		const cProfiles = allocateStringOnStack(instance, JSON.stringify({ profile }));
		const cProfile = allocateStringOnStack(instance, 'profile');

		const opt = instance.exports.quiet_decoder_profile_str(cProfiles, cProfile);
		this.decoder = instance.exports.quiet_decoder_create(opt, this.sampleRate);
		instance.exports.free(opt);

		this.samples = mallocArray(sampleBufferSize, this.instance);
		this.frame = instance.exports.malloc(sampleBufferSize);

		instance.exports.stackRestore(stack);
		return this;
	}

	process(inputs) {
		if (!inputs[0].length) {
			return true;
		}
		const input = inputs[0];

		this.inputRingBuffer.push([...input]);

		if (this.inputRingBuffer.framesAvailable >= sampleBufferSize) {
			this.inputRingBuffer.pull([this.samples.view]);

			this.bufferIndex = 0;
			this.instance.exports.quiet_decoder_consume(
				this.decoder,
				this.samples.pointer,
				sampleBufferSize
			);

			const read = this.instance.exports.quiet_decoder_recv(
				this.decoder,
				this.frame,
				sampleBufferSize
			);

			if (read !== -1) {
				const HEAPU8 = new Int8Array(this.instance.exports.memory.buffer);

				const slice = HEAPU8.slice(this.frame, this.frame + read);
				const value = decode(slice.buffer);
				this.port.postMessage({
					type: 'payload',
					value
				});
			}
		}

		return true;
	}
}

registerProcessor('quiet-receiver-worklet', ReceiverWorklet);
