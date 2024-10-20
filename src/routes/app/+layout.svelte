<script>
  import {onMount} from "svelte";
  import {wallet, loadWallet} from "$lib/shared"
  import { goto } from '$app/navigation';
    
    
  onMount(() => {
    loadWallet();

    if($wallet == '') {
      alert("error generating wallet");
      goto("/");
    }
  })
</script>
<slot />
