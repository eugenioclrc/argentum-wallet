<script lang="ts">
	import '../app.css';

	export const prerender = true;

	import { onMount } from 'svelte';
import { loadWallet } from '$lib/shared';


onMount(() => {
  loadWallet();
})
</script>

<div class="w-full bg-gray-800">
	<slot />
</div>
