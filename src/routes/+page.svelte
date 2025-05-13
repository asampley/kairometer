<script lang="ts">
	import type { WeatherApiResponse } from "@openmeteo/sdk/weather-api-response";
	import type { Result, Stats } from "../main";

	import { onMount } from "svelte";
	import { collect_stats, date_boundaries, format_variable, get_forecast, graph_data, graph_unit, no_default, unit_short } from "../main";
	import { rules } from "../rules.svelte";
	import { forecast_settings } from "../settings.svelte";

	import Title from "../components/Title.svelte";
	import Nav from "../components/Nav.svelte";
	import Graph from "../components/Graph.svelte";

	const variables = $derived(rules.map((v) => v.variable));

	let forecast: Result<WeatherApiResponse, any> | null = $state(null);

	let stats: Stats | null = $derived(forecast && "ok" in forecast ? collect_stats(rules, variables, forecast.ok) : null);
	let graphs = $derived(forecast && "ok" in forecast
		? variables.map((_, i) => graph_data(i, forecast.ok))
		: []
	);

	let markers = $derived(variables.flatMap(v => rules.values().filter(r => r.variable == v).map(r => [r.greater_than, r.less_than].filter(x => x !== undefined)).toArray()));

	async function update_forecast() {
		try {
			const next = await get_forecast(variables, forecast_settings);

			forecast = { ok: next[0] };
		} catch (e) {
			forecast = { err: e };
		}

		if (Notification.permission === "granted") {
			new Notification("Kairometer", { body: "Forecast updated!", icon: "/icon.svg" });
		}
	}

	const dateMarkers = $derived(
		forecast && "ok" in forecast
			? date_boundaries(forecast.ok).toArray()
			: []
	);

	let now = $state(new Date());

	$effect(() => {
		const id = setInterval(() => now = new Date(), 60000);

		return () => clearInterval(id);
	});

	const markX = $derived([
		{ color: "#333333", values: dateMarkers },
		{ color: "green", values: [now] },
	]);

	onMount(async () => {
		await update_forecast();

		if (Notification.permission !== "denied") {
			await Notification.requestPermission();
		}
	});
</script>

<main class="container">
	<Title/>
	<Nav/>

	{#if !forecast}
		<p>Loading...</p>
	{:else if 'ok' in forecast}
		{#if stats.violations.length > 0}
			<h3>Warnings</h3>
			<ul class="warning">
				{#each stats.violations as violation}
					<li>{violation.name} for {violation.total_minutes} minutes.</li>
				{/each}
			</ul>
		{/if}

		<form onsubmit={no_default(update_forecast)}>
			<button type="submit"><i class="fa-solid fa-rotate"></i>Refresh Forecast</button>
		</form>

		{#each graphs as data, i}
			<h2>{variables[i].replace('_', ' ') + " (" + unit_short(graph_unit(i, forecast.ok)) + ")"}</h2>
			<Graph
				{data}
				{markX}
				markY={markers[i]}
				formatY={format_variable(graph_unit(i, forecast.ok))}
				width="100%"
				height="300px"
			/>
		{/each}
	{:else}
		<div class="error">
			<h3>Forecast Error</h3>
			<p><b><i>Please check that you've correctly spelled your rule variables.</i></b></p>
			<p>{forecast.err}</p>
		</div>
	{/if}
</main>

<style>
.container > * {
	margin-left: auto;
	margin-right: auto;
}
</style>
