<script>
	import { formatEther } from 'viem';
	import { wallet } from '$lib/shared';

	import ReceiveModal from './ReceiveModal.svelte';
	import SendModal from './SendModal.svelte';

	import { onMount } from 'svelte';

	import { loadWallet } from '$lib/shared';
	import { goto } from '$app/navigation';

	let receiver;
	let amount;

	onMount(() => {
		loadWallet();

		if ($wallet == '') {
			alert('error generating wallet');
			goto('/');
		}
		try{
			// Get query string from URL
			const urlParams = new URLSearchParams(window.location.search);
			let payment = urlParams.get('payment') || '';
			receiver = payment.split('?')[0].replace('ethereum:', '');
			amount = String(formatEther(payment.split('?value=')[1]));

			if (receiver && amount) {
				modalSend = true;
			}
		} catch(err) {}
	});

	//import QArt from 'qartjs';

	let modal = false;
	let modalSend = false;
</script>

<div class="mx-auto h-screen max-w-md bg-gray-100 p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">USDC balance</h1>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 text-gray-600"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
	</div>

	<div class="mb-6">
		<span class="text-6xl">$ 23152</span>
		<span class="text-2xl text-gray-500">.02</span>
		<!--
            <span class="ml-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">$8240</span>
			-->
	</div>

	<!--<div class="flex space-x-4">-->
	<div class="mb-6 grid grid-cols-4 gap-4">
		<button class="flex flex-col items-center" on:click={() => (modalSend = true)}>
			<div class="rounded-2xl bg-white p-3 shadow-md">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-800"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 10l7-7m0 0l7 7m-7-7v18"
					/>
				</svg>
			</div>
			<span class="mt-2 text-sm font-medium text-gray-800">Send</span>
		</button>

		<button
			class="flex flex-col items-center"
			on:click={() => {
				modal = true;
			}}
		>
			<div class="rounded-2xl bg-white p-3 shadow-md">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-800"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
				</svg>
			</div>
			<span class="mt-2 text-sm font-medium text-gray-800">Receive</span>
		</button>

		<button class="flex flex-col items-center">
			<div class="rounded-2xl bg-white p-3 shadow-md">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-800"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
			<span class="mt-2 text-sm font-medium text-gray-800">Buy</span>
		</button>

		<button class="flex flex-col items-center">
			<div class="rounded-2xl bg-white p-3 shadow-md">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-gray-800"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
					/>
				</svg>
			</div>
			<span class="mt-2 text-sm font-medium text-gray-800">Swap</span>
		</button>
	</div>

	<div class="mb-6 rounded-lg bg-blue-100 p-4">
		<div class="mb-2 flex items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mr-2 h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<span class="font-semibold">Your Wallet:</span>
		</div>
		<div class="flex items-center justify-between">
			{#if $wallet}
				<a
					href="https://testnet.avascan.info/blockchain/dfk/address/{$wallet}"
					class="font-semibold"
					target="_blank">{$wallet.slice(0, 8)}...{$wallet.slice(-8)}</a
				>
			{/if}
		</div>
	</div>
	<!--
        <div class="bg-gray-800 text-white p-4 rounded-lg mb-6">
            <div class="flex justify-between items-center">
                <span>Subscriptions</span>
                <span class="font-semibold">105.20</span>
            </div>
            <div class="text-sm text-gray-400">2 active</div>
        </div>
        -->

	<div>
		<h2 class="mb-4 text-xl font-semibold">History</h2>
		<div class="mb-2 flex items-center justify-between rounded-lg bg-gray-100 p-4">
			<div>
				<div class="font-semibold">Received</div>
				<div class="text-sm text-gray-600">EQDn6I8M...CI3t</div>
			</div>
			<div class="text-green-500">+227.28</div>
		</div>
		<div class="flex items-center justify-between rounded-lg bg-gray-100 p-4">
			<div>
				<div class="font-semibold">Sent</div>
				<div class="text-sm text-gray-600">MBI6nDQE...r3LO</div>
			</div>
			<div class="text-red-500">-3100</div>
		</div>
	</div>
</div>

<ReceiveModal bind:modal />
<SendModal bind:modal={modalSend} {receiver} {amount} />
