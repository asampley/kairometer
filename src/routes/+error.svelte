<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="container">
	<h3 class="error">There was an error rendering this page.</h3>
	{#if page.error?.message != null }
		<p class="error">{ page.error.message }</p>
	{/if}
</main>
