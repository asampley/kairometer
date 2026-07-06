<script lang="ts">
	import Title from "../components/Title.svelte";
	import Nav from "../components/Nav.svelte";

	import '@fortawesome/fontawesome-free/css/all.min.css'

	let { children } = $props();
</script>

<main class="container">
	<Title/>
	<Nav/>

	{@render children()}
</main>

<style >
main > :global(*) {
	margin-left: auto;
	margin-right: auto;
}
</style>
