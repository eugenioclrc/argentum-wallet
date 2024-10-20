<script>
	import { wallet, walletClient } from '$lib/shared';
	import Quiet from '$lib/quiet-js/index.js';
	import quietProfiles from '$lib/quiet-js/profiles';
	import { parseEther, formatEther } from 'viem';

	export let receiver = '';
	export let amount = '';
	export let modal = false;

	$: if (!modal) {
		receiver = '';
		amount = '';
		step = 0;
		imgData = '';
	}

	let step = 0;
	let imgData = '';

	function nextStep() {
		step = (step + 1) % 2;
	}

	async function scanQr() {
		alert('not avaiable for now');
	}

	async function send() {
		let [account] = await $walletClient.getAddresses();
		await $walletClient.writeContract({
			address: '0x5425890298aed601595a70ab815c96711a31bc65', //USDC on fuji: https://testnet.snowtrace.io/token/0x5425890298aed601595a70ab815c96711a31bc65
			abi: [
				{
					inputs: [
						{ name: 'to', type: 'address' },
						{ name: 'amoun', type: 'uint256' }
					],
					name: 'transfer',
					outputs: [],
					stateMutability: 'nonpayable',
					type: 'function'
				}
			],
			functionName: 'transfer',
			args: [receiver, parseEther(amount)],
			account
		});
	}

	let quiet;

	async function hearSound() {
		if (!quiet) {
			const audioContext = new AudioContext();

			quiet = await new Quiet(audioContext, quietProfiles.audible).init();
		}
		quiet.receive(parseData);
	}

	let chunks = [];
	let lastReceived = 0;
	function parseData(data) {
		let elapsed = (+new Date() - lastReceived) / 1000;
		if (elapsed < 1000) {
			chunks = [];
		}
        lastReceived = +new Date();
		chunks.push(data.value);

		// uniq data
		chunks = [...new Set(chunks)];
        console.log(chunks)
		if (chunks.length > 2) {
			let newData = transformArray(chunks);
			console.log(chunks, newData);
			if (newData) {
				receiver = newData.split('?')[0].replace('ethereum:', '');
				amount = String(parseStringToNumber(newData.split('?value=')[1]));
			}
		}
	}

	function parseStringToNumber(str) {
		// Remove any non-numeric characters, just in case
		const cleanStr = str.replace(/\D/g, '');

		// Add the decimal point two places from the end
		const length = cleanStr.length;

		if (length <= 2) {
			return `0.${cleanStr.padStart(2, '0')}`;
		} else {
			const integerPart = cleanStr.slice(0, length - 2);
			const decimalPart = cleanStr.slice(length - 2);
			return `${integerPart}.${decimalPart}`;
		}
	}

	/**
	 * @param {any[]} arr
	 */
	function transformArray(arr) {
		// Find the ethereum address
		const ethereumAddress = arr.find((el) => el.startsWith('ethereum:'));
		if (!ethereumAddress) return '';
		// Find the rest of the address after 'ethereum:'
		const restOfAddress = arr.find((el) => /^[0-9a-fA-F]{10,}$/.test(el));
		if (!restOfAddress) return '';
		// Find the value (assuming it's in the form '?value=<somevalue>')
		const value = arr.find((el) => el.includes('?value='));
		if (!value) {
			return '';
		}

		let last = '';
		if (arr.lenth > 3) {
			last = arr.find((el) => /^([0-9])+$/.test(el));
		}

		// Combine everything into the final expected string
		const result = ethereumAddress + restOfAddress + value + last;

		return result;
	}
</script>

{#if modal}
	<!-- Modal -->
	<modal class="fixed inset-0 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
			<div class="mt-3 text-center">
				<h3 class="text-lg font-medium leading-6 text-gray-900">Send USDC</h3>
				<div class="mt-2 px-7 py-3">
					<p class="text-sm text-gray-500">
						Enter the recipient's Ethereum address and the amount to send:
					</p>
					<!-- Input field for Ethereum compatible address -->
					<div class="mt-3">
						<label for="receiver" class="block text-sm font-medium text-gray-700"
							>Receiver Address</label
						>
						<input
							type="text"
							id="receiver"
							name="receiver"
							placeholder="Enter Ethereum address"
							bind:value={receiver}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
						/>
					</div>
					<!-- Input field for amount limited to 2 decimal places -->
					<div class="mt-3">
						<label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
						<input
							type="number"
							bind:value={amount}
							name="amount"
							placeholder="Enter amount in USDC"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
							step="0.01"
							min="0"
						/>
					</div>
				</div>

				<!-- Action buttons -->

				<div class="mt-4 flex justify-center space-x-4">
					<button
						disabled={amount == '' || receiver == ''}
						class="flex items-center rounded-md bg-green-500 px-4 py-2 text-white disabled:bg-gray-400"
						on:click
					>
						$! Send
					</button>

					<button
						class="flex items-center rounded-md bg-green-500 px-4 py-2 text-white"
						on:click={hearSound}
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
						Hear
					</button>
					<!--
                <button class="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center" on:click={scanQr}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  Scan
                </button>-->
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
				</div>
			</div>
		</div>
	</modal>
{/if}