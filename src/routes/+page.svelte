<script lang="ts">
	import type { WeatherApiResponse } from "@openmeteo/sdk/weather-api-response";
	import type { Result, Stats } from "../main";

	import { onMount } from "svelte";
	import { collect_stats, date_boundaries, dateFormatter, format_variable, get_forecast, graph_data, graph_unit, no_default } from "../main";
	import { rules } from "../rules.svelte";
	import { forecast_settings, graph_settings, locations } from "../settings.svelte";

	import Title from "../components/Title.svelte";
	import Nav from "../components/Nav.svelte";
	import Graph from "../components/Graph.svelte";

	// TODO service workers
	//import "../workers.ts";

	const variables = $derived(new Set(rules.map(v => v.variable)).union(new Set(graph_settings.flatMap(g => g.plots.map(p => p.variable)))));
	const variablesArray = $derived(variables.values().toArray());

	let forecasts: (Result<WeatherApiResponse, any> | null)[] = $state(locations.map(() => null));

	let location_i: number = $state(0);

	let forecast: Result<WeatherApiResponse, any> | null = $derived(forecasts[location_i]);

	let stats: Stats | null = $derived(forecast && "ok" in forecast ? collect_stats(rules, variablesArray, forecast.ok, new Date()) : null);
	let graphs = $derived(graph_settings.flatMap(g => { return {
		name: g.name,
		plots: g.plots.map(p => {
			const variable_i = variablesArray.indexOf(p.variable);

			return {
				color: p.color,
				data: forecast && "ok" in forecast ? graph_data(variable_i, forecast.ok) : [],
				markY: !p.show_rules ? [] : rules
					.values()
					.filter(r => r.variable == p.variable)
					.map(r => [r.greater_than, r.less_than].filter(x => x != undefined))
					.toArray(),
				format: (y: number) => p.variable + ": " + (forecast && "ok" in forecast ? format_variable(graph_unit(variable_i, forecast.ok))(y) : y.toString()),
			}
		}),
	}}));

	async function update_forecast() {
		try {
			const next = await get_forecast(variables.values().toArray(), forecast_settings, locations[location_i]);

			forecasts[location_i] = { ok: next[0] };
		} catch (e) {
			forecasts[location_i] = { err: e };
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

	$effect(() => {
		if (forecasts[location_i] == null) {
			update_forecast()
		}
	});

	$effect(() => {
		if (stats != null && stats.violations.length > 0 && Notification.permission === "granted") {
			var body = "Warnings:";
			for (var violation of stats.violations) {
				body += "\n" + violation.name + " on " + dateFormatter.format(violation.start);
			}
			new Notification("Kairometer", { body: body, icon: "/icon.svg" });
		}
	})

	const markX = $derived([
		{ color: "#333333", values: dateMarkers },
		{ color: "green", values: [now] },
	]);

	onMount(async () => {
		if (Notification.permission !== "denied") {
			await Notification.requestPermission();
		}
	});
</script>

<main class="container">
	<Title/>
	<Nav/>

	<select bind:value={location_i}>
		{#each locations as location, i}
			<option value={i}>{location.name}</option>
		{/each}
	</select>

	{#if !forecast}
		<p>Loading...</p>
	{:else if 'ok' in forecast}
		{#if stats != null && stats.violations.length > 0}
			<h3>Warnings</h3>
			<ul class="warning">
				{#each stats.violations as violation}
					<li>{violation.name} on {dateFormatter.format(violation.start)}</li>
				{/each}
			</ul>
		{/if}

		<form onsubmit={no_default(update_forecast)}>
			<button type="submit"><i class="fa-solid fa-rotate"></i>Refresh Forecast</button>
		</form>

		{#each graphs as graph, i}
			<h2>{graph.name}</h2>
			<Graph
				plots={graph.plots}
				{markX}
				markY={graph.markY}
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
