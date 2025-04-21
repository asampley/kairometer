<script lang="ts">
	import type { WeatherApiResponse } from "@openmeteo/sdk/weather-api-response";
	import type { Result, Stats } from "../main";

	import { onMount } from "svelte";
	import { collect_stats, get_forecast, graph_data, no_default } from "../main";
	import { rules, add_rule, load_rules, remove_rule, save_rules } from "../rules.svelte";

	import Graph from "../components/Graph.svelte";
	import DataLists from "../components/DataLists.svelte";

	let variables = $derived(rules.map((v) => v.variable));

	let forecast: Result<WeatherApiResponse, any> | null = $state(null);

	let stats: Stats = $derived(forecast && "ok" in forecast ? collect_stats(rules, variables, forecast.ok) : null);
	let graphs = $derived(forecast && "ok" in forecast
		? variables.map((_, i) => graph_data(i, forecast.ok))
		: []
	);
	let markers = $derived(variables.flatMap(v => rules.values().filter(r => r.variable == v).map(r => [r.greater_than, r.less_than].filter(x => x !== undefined)).toArray()));

	async function update_forecast() {
		try {
			const next = await get_forecast(variables);

			forecast = { ok: next[0] };
		} catch (e) {
			forecast = { err: e };
		}

		if (Notification.permission === "granted") {
			new Notification("Kairometer", { body: "Forecast updated!", icon: "/icon.svg" });
		}
	}

	onMount(async () => {
		load_rules();
		await update_forecast();

		if (Notification.permission !== "denied") {
			await Notification.requestPermission();
		}
	});
</script>

<main class="container">
	<DataLists/>
	<div class="row">
		<h1>Kairometer</h1>
	</div>

	<form onsubmit={no_default(update_forecast)}>
		<button type="submit"><i class="fa-solid fa-rotate"></i> Refresh Forecast</button>
		<fieldset>
			<legend>Rules</legend>
			{#each rules as rule, i (rule)}
				<fieldset class="row">
					<input type="text" bind:value={rule.name} placeholder="Name" onblur={save_rules}>
					<input type="text" bind:value={rule.variable} placeholder="Variable" list="hourlyVariables" onblur={save_rules}>
					<input type="number" bind:value={rule.greater_than} placeholder="Greater Than (blank for unbounded)" onblur={save_rules}>
					<input type="number" bind:value={rule.less_than} placeholder="Less Than (blank for unbounded)" onblur={save_rules}>
					<button onclick={() => remove_rule(i)}>X</button>
				</fieldset>
			{/each}
			<button onclick={() => add_rule("")}>Add Rule</button>
		</fieldset>
	</form>
	{#if !forecast}
		<p>Loading...</p>
	{:else if 'ok' in forecast}
		{#if stats.violations.length > 0}
			<h3>Warnings</h3>
			<ul>
				{#each stats.violations as violation}
					<li>{violation.name} for {violation.total_minutes} minutes.</li>
				{/each}
			</ul>
		{/if}

		{#each graphs as graph, i}
			<h2>{variables[i]}</h2>
			<Graph data={graph} markY={markers[i]} width="100%" height="300px"/>
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
.logo:hover {
	filter: drop-shadow(0 0 2em #747bff);
}

:root {
	font-family: "Andika", "Helvetica Neue", Helvetica, Arial, sans-serif;
	font-size: 16px;
	line-height: 24px;
	font-weight: 400;

	color: #f6f6f6;
	background-color: #2f2f2f;

	font-synthesis: none;
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	-webkit-text-size-adjust: 100%;
}

.container {
	margin: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	text-align: center;
}

.container > * {
	margin-left: auto;
	margin-right: auto;
}

.logo {
	height: 6em;
	padding: 1.5em;
	will-change: filter;
	transition: 0.75s;
}

.row {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}

.error {
	color: hotpink;
}

a {
	font-weight: 500;
	color: #646cff;
	text-decoration: inherit;
}

a:hover {
	color: #24c8db;
}

h1 {
	font-size: 4rem;
	font-style: italic;
	text-align: center;
	color: #947bff;
}

form {
	margin-left: auto;
	margin-right: auto;
}

fieldset fieldset {
	border: none;
}

fieldset.row {
	gap: 0.5rem;
}

input,
button {
	border-radius: 8px;
	border: 1px solid transparent;
	padding: 0.6em 1.2em;
	font-size: 1em;
	font-weight: 500;
	font-family: inherit;
	color: #ffffff;
	background-color: #0f0f0f98;
	transition: border-color 0.25s;
	box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
	cursor: pointer;
}

button:hover {
	border-color: #396cd8;
}
button:active {
	border-color: #396cd8;
	background-color: #0f0f0f69;
}

input,
button {
	outline: none;
}

@media (prefers-color-scheme: light) {
	:root {
		color: #0f0f0f;
		background-color: #f6f6f6;
	}

	a:hover {
		color: #535bf2;
	}

	input,
	button {
		color: #0f0f0f;
		background-color: #ffffff;
	}
	button:active {
		background-color: #e8e8e8;
	}
}
</style>
