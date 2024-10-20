<script>
	import { wallet } from '$lib/shared';
	import Quiet from '$lib/quiet-js/index.js';
	import quietProfiles from '$lib/quiet-js/profiles';
	import { parseEther } from 'viem';

	/** @type {HTMLDivElement} */
	let qartEl;

	export let modal = false;
	export let maxValue = 1000;
	let amountToReceive = '0';

	$: if (!modal) {
		amountToReceive = '0';
		step = 0;
		imgData = '';
	}

	function updateN() {
		// Elimina los ceros a la izquierda
		amountToReceive = String(amountToReceive).replace(/^0+/, '');
		// Redondea el número a dos decimales, ya sea con '.' o ','
		amountToReceive = String(amountToReceive).replace(/([.,]\d{2})\d+/, '$1');
	}

	let step = 0;
	let imgData = '';

	function getPaymentData() {
		const val = parseEther(amountToReceive);
		return `ethereum:${$wallet}?value=${val}`;
	}

	function getPaymentDataUrl() {
		return `${window.location.origin}/app?payment=${encodeURIComponent(getPaymentData())}`;
	}

	function nextStep() {
		step = (step + 1) % 2;

		const qart = new window.QArt({
			value: getPaymentDataUrl(),
			imagePath: './landing.png',
			//imagePath: './logo.png',
			//filter: filter,
			filter: 'color',
			//version: 10,
			//var imageSize = 75 + (version * 12) - 24;
			bg: '#FFF',
			//var size = "175";
			fillType: 'fill'
		});

		qart.make(qartEl);
		setTimeout(() => {
			imgData = qartEl && qartEl.children && qartEl.children[0] && qartEl.children[0].toDataURL();
		}, 100);
	}

	let quiet;

	async function playSound() {
		if (!quiet) {
			const audioContext = new AudioContext();

			quiet = await new Quiet(audioContext, quietProfiles.audible).init();
		}

		let val = Number(amountToReceive).toFixed(2).replace('.', '');

		let data = `ethereum:${$wallet}?value=${val}`;
        //0xd8da6bf26964af9d7eed9e0
        //1x3e53415d37aa96045

        console.log(data)
		await quiet.transmit({
			clampFrame: true,
			payload: data
		});
		// idle 250 ms
		await new Promise((resolve) => {
			setTimeout(resolve, 250);
		});

		await quiet.transmit({
			clampFrame: true,
			payload: data
		});
        await quiet.transmit({
			clampFrame: true,
			payload: data
		});
	}

	async function sharePayment() {
		const shareData = {
			title: 'MDN',
			text: `Send a payment of ${amountToReceive}USDC to ${$wallet}`,
			url: getPaymentDataUrl()
		};

		// Share must be triggered by "user activation"
		try {
			await navigator.share(shareData);
		} catch (err) {
			// Get the text field
			//var copyText = document.getElementById("myInput");
			//
			let copyText = document.createElement('input');
			copyText.value = getPaymentDataUrl();

			// Select the text field
			copyText.select();
			copyText.setSelectionRange(0, 99999); // For mobile devices

			// Copy the text inside the text field
			navigator.clipboard.writeText(copyText.value);

			alert('Url copied to clipboard');
		}
	}
</script>

{#if modal}
	<!-- Modal -->
	<modal class="fixed inset-0 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
			<div class="mt-3 text-center">
				<h3 class="text-lg font-medium leading-6 text-gray-900">Receive USDC</h3>
				<div class="mt-2 px-7 py-3">
					<p class="text-sm text-gray-500">
						{#if step == 0}
							Enter amount to receive:
						{:else}
							Show the next QR<br />
							<span class="text-2xl text-black">Receive amount: {amountToReceive} USDC</span>
						{/if}
					</p>
					<div class="mt-3">
						{#if step == 0}
							<label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
							<input
								type="number"
								bind:value={amountToReceive}
								on:change={updateN}
								name="amount"
								placeholder="Enter amount in USDC"
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
								step="0.01"
								min="0"
								max={maxValue}
							/>
						{:else}
							<img id="qr" src={imgData} class="w-full" alt="qr payment" />
						{/if}
					</div>

					{#if step != 0}
						<div class="mt-4 flex justify-center space-x-4">
							<button
								class="flex items-center rounded-md bg-green-500 px-4 py-2 text-white"
								on:click={playSound}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
										clip-rule="evenodd"
									/>
								</svg>
								Audio
							</button>

							<button
								class="flex items-center rounded-md bg-green-500 px-4 py-2 text-white"
								on:click={sharePayment}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<g stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
										<g>
											<g>
												<path
													d="M339.588,314.529c-14.215,0-27.456,4.133-38.621,11.239l-112.682-78.67c1.809-6.315,2.798-12.976,2.798-19.871 c0-6.896-0.989-13.557-2.798-19.871l109.64-76.547c11.764,8.356,26.133,13.286,41.662,13.286c39.79,0,72.047-32.257,72.047-72.047 C411.634,32.258,379.378,0,339.588,0c-39.79,0-72.047,32.257-72.047,72.047c0,5.255,0.578,10.373,1.646,15.308l-112.424,78.491 c-10.974-6.759-23.892-10.666-37.727-10.666c-39.79,0-72.047,32.257-72.047,72.047s32.256,72.047,72.047,72.047 c13.834,0,26.753-3.907,37.727-10.666l113.292,79.097c-1.629,6.017-2.514,12.34-2.514,18.872c0,39.79,32.257,72.047,72.047,72.047 c39.79,0,72.047-32.257,72.047-72.047C411.635,346.787,379.378,314.529,339.588,314.529z"
												></path>
											</g>
										</g>
									</g>
								</svg>
								Share
							</button>
						</div>
					{/if}

					<div class="mt-4 flex justify-center space-x-4">
						<button
							class="flex items-center rounded-md bg-gray-500 px-4 py-2 text-white"
							on:click={() => {
								modal = false;
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
							Close
						</button>
						<button
							class="{step == 0
								? 'bg-green-500'
								: 'bg-gray-500'} flex items-center rounded-md px-4 py-2 text-white disabled:bg-gray-300"
							on:click={nextStep}
							disabled={step == 0 && parseFloat(amountToReceive) == 0}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v3a1 1 0 00.293.707l2 2a1 1 0 001.414-1.414L11 10.586V8z"
									clip-rule="evenodd"
								/>
							</svg>
							{#if step == 0}Next{:else}Back{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</modal>
{/if}
<div class="hidden" id="qart" bind:this={qartEl} />
<img class="hidden" src="/landing.png" />