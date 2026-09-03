<script lang="ts">
	import type { Stats } from "../main";

	import { onMount } from "svelte";
	import { collect_stats, date_boundaries, dateFormatter, format_variable, index_nearest, no_default, notify } from "../main";
	import { rules } from "../rules.svelte";
	import { graph_settings, locations } from "../settings.svelte";
	import { forecasts, graph_variable_index, save_forecasts, update_forecast, type Forecast } from "../forecasts.svelte";

	import Graph, { type MarkX, type Plot } from "../components/Graph.svelte";
	//import GraphLegend from "../components/GraphLegend.svelte";

	// Save forecasts as soon as they change
	$effect(() => save_forecasts());

	const variables = $derived(new Set(rules.map(v => v.variable)).union(new Set(graph_settings.flatMap(g => g.plots.map(p => p.variable)))));
	const variablesArray = $derived(variables.values().toArray());

	let location_i: number = $state(0);

	let forecast: Forecast | null = $derived(forecasts[location_i]);

	let forecast_derived: { stats: Stats, markX: MarkX[], graphs: { name: string, width_css: string, plots: Plot[] }[] } | null = $state(null);

	function scroll_graph(id: string, proportion: number) {
		const graph = document.querySelector("#" + id);
		if (graph) {
			graph.scrollTo({
				left: proportion * (graph.scrollWidth - graph.clientWidth),
			});
		} else {
			console.warn("Graph not found for scrolling");
		}
	}

	function proportion(min: number, value: number, max: number): number {
		return (value - min) / (max - min);
	}

	function graph_scroller_id(i: number): string {
		return "graph_scroller_" + i;
	}

	$effect(() => {
		if (!forecast) {
			forecast_derived = null;
		} else {
			try {
				forecast_derived = {
					stats: collect_stats(rules, variablesArray, forecast, new Date()),
					markX: ([
						{ color: "#333333", values: date_boundaries(forecast).toArray() },
						{ color: "green", values: [now] },
					]),
					graphs: graph_settings.flatMap(g => { return {
						name: g.name,
						width_css: g.width_css,
						plots: g.plots.map(p => {
							const variable_i = graph_variable_index(p.variable, forecast);

							if (variable_i === null) {
								return null;
							}

							return {
								color: p.color,
								name: p.variable,
								data: forecast.data[variable_i].data,
								markY: !p.show_rules ? [] : rules
									.values()
									.filter(r => r.variable == p.variable)
									.flatMap(r => [r.greater_than, r.less_than].filter(x => x != undefined))
									.toArray(),
								format: (y: number) => (format_variable(forecast.data[variable_i].unit))(y),
							}
						})
						.filter(v => v != null),
					}}),
				}
			} catch (e) {
				forecast_derived = null;
				// probably a type error due to bad forecast
				forecast_error = e;
			}
		}
	});

	let now = $state(new Date());
	let markerX: (number | null)[] = $state(default_marker_x());
	let markerHoverI: (number | null)[] = $state(graph_settings.map(_ => null));

	function on_location_change(location_i: number) {
		markerX = default_marker_x();

		graph_settings.forEach((_, i) => {
			if (forecast == null) return null;
			const index = index_nearest(forecast, new Date());
			if (index == null) return null;
			scroll_graph(graph_scroller_id(i), proportion(0, index, forecast.data[0].data.length - 1))
		});
	}

	function default_marker_x() {
		return graph_settings.map(_ => {
			if (forecast == null) return null;

			return index_nearest(forecast, new Date());
		});
	}

	$effect(() => on_location_change(location_i));

	let refresh: boolean = $state(false);
	let forecast_error: any | null = $state(null);

	$effect(() => {
		const id = setInterval(() => now = new Date(), 60000);

		return () => clearInterval(id);
	});

	$effect(() => {
		if (refresh) {
			forecast_error = null;
			console.log("Refreshing forecast...");
			update_forecast(variablesArray, location_i)
				.then(() => {
					forecast_error = null;
					console.log("Refreshed forecast");
				}).catch(e => {
					forecast_error = e;
					console.error("Failed to refresh forecast: " + forecast_error);
				}).finally(() => {
					refresh = false;
				});
		}
	});

	$effect(() => {
		if (forecast == null) {
			refresh = true;
		}
	});

	$effect(() => {
		if (forecast_derived != null && forecast_derived.stats.violations.length > 0 && Notification.permission === "granted") {
			const body = forecast_derived.stats.violations
				.map(violation => violation.name + " on " + dateFormatter.format(violation.start))
				.join("\n");

			notify("Weather Warning", { body: body });
		}
	})

	onMount(() => {
		if (Notification && Notification.permission !== "denied" && "requestPermission" in Notification) {
			Notification.requestPermission();
		}
	});
</script>

<select bind:value={location_i}>
	{#each locations as location, i}
		<option value={i}>{location.name}</option>
	{/each}
</select>

<form onsubmit={no_default(() => { refresh = true; })}>
	<button type="submit" disabled={refresh}><i class="fa-solid fa-rotate { refresh ? 'animation-spin' : '' }"></i> Refresh Forecast</button>
</form>

{#if forecast_error != null}
	<div class="error">
		<h3>Forecast Error</h3>
		<p><b><i>Please check that you've correctly spelled your rule variables.</i></b></p>
		<p>{forecast_error.toString()}</p>
	</div>
{/if}

{#if forecast != null && forecast_derived != null}
	<p>Last forecast: { dateFormatter.format(forecast.time) }</p>
	{#if forecast_derived.stats.violations.length > 0}
		<h3>Warnings</h3>
		<ul class="warning">
			{#each forecast_derived.stats.violations as violation}
				<li>{violation.name} on {dateFormatter.format(violation.start)}</li>
			{/each}
		</ul>
	{/if}
	{#each forecast_derived.graphs as graph, g_i}
		<h2>{graph.name}</h2>
		<div id={graph_scroller_id(g_i)} class="graph-window">
			<Graph
				plots={graph.plots}
				markX={forecast_derived.markX}
				defaultMarkerX={markerX[g_i]}
				width={graph.width_css}
				bind:markerHoverI={markerHoverI[g_i]}
				height="300px"
			/>
		</div>
		<input type="range" min="0" max={graph.plots[0].data.length-1} bind:value={markerX[g_i]} class="graph-position-select" oninput={event => scroll_graph(graph_scroller_id(g_i), proportion(event.target.min, event.target.value, event.target.max))}/>
	{/each}
{/if}
