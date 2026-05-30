<script lang="ts">
	import DataLists from "../../components/DataLists.svelte";
	import Title from "../../components/Title.svelte";
	import Nav from "../../components/Nav.svelte";

	import { rules, add_rule, remove_rule, save_rules } from "../../rules.svelte";
	import { forecast_settings, locations, graph_settings, save_forecast_settings, save_locations, save_graph_settings, type GraphSettings } from "../../settings.svelte";

	function add_location() {
		locations.push({
			name: "New Location",
			latitude: 0,
			longitude: 0,
		}),

		save_locations();
	}

	function remove_location(i: number) {
		locations.splice(i, 1);
		save_locations();
	}

	function add_graph_settings() {
		graph_settings.push({
			name: "New Graph",
			plots: [
				{
					color: "#947bff",
					variable: "",
					show_rules: true,
				}
			]
		});

		save_graph_settings();
	}

	function add_plot(graph: GraphSettings) {
		graph.plots.push( {
			color: "#947bff",
			variable: "",
			show_rules: true,
		});

		save_graph_settings();
	}

	function remove_graph_settings(i: number) {
		graph_settings.splice(i, 1);
		save_graph_settings();
	}

	function remove_plot(graph: GraphSettings, i: number) {
		graph.plots.splice(i, 1);
		save_graph_settings();
	}
</script>

<main class="container">
	<Title/>
	<Nav/>
	<DataLists/>
	<p>Take a look at <a href="https://open-meteo.com/en/docs">https://open-meteo.com/en/docs</a> for more detailed description and listing of the variables available, as well as a description of the data sources.</p>
	<form>
		<fieldset>
			<legend>Locations</legend>
			{#each locations as location, i (location)}
				<fieldset class="row">
					<div>
						<label for={"location-" + i + "-name"}>Name</label><br>
						<input id={"location-" + i + "-name"} type="text" bind:value={location.name} placeholder="Name" onblur={save_locations}>
					</div>
					<div>
						<label for={"location-" + i + "-latitude"}>Latitude</label><br>
						<input id={"location-" + i + "-latitude"} type="text" bind:value={location.latitude} placeholder="Latitude" onblur={save_locations}>
					</div>
					<div>
						<label for={"location-" + i + "-longitude"}>Longitude</label><br>
						<input id={"location-" + i + "-longitude"} type="text" bind:value={location.longitude} placeholder="Longitude" onblur={save_locations}>
					</div>
					<input type="button" value="&#xf1f8;" onclick={() => { if (locations.length > 1) { remove_location(i) } } }>
				</fieldset>
			{/each}
			<input type="button" value="Add Location" onclick={() => add_location() }>
		</fieldset>
	</form>
	<form>
		<fieldset>
			<legend>Forecast</legend>
			<fieldset>
				<label for="past_days">Past Days</label><br>
				<input id="past_days" type="number" bind:value={forecast_settings.past_days} placeholder="0" onblur={save_forecast_settings}><br>
				<label for="forecast_days">Forecast Days</label><br>
				<input id="forecast_days" type="number" bind:value={forecast_settings.forecast_days} placeholder="7" onblur={save_forecast_settings}><br>
			</fieldset>
		</fieldset>
	</form>
	<form>
		<fieldset>
			<legend>Graphs</legend>
			{#each graph_settings as graph, g (graph)}
				<fieldset>
					<legend>{graph.name}</legend>
					<input type="text" bind:value={graph.name} placeholder="Name" onblur={save_graph_settings}>
					<input type="button" value="&#xf1f8;" onclick={() => remove_graph_settings(g)}>
					{#each graph.plots as plot, i (plot)}
						<fieldset class="row">
							<input type="text" bind:value={plot.variable} placeholder="Variable" list="hourlyVariables" onblur={save_graph_settings}>
							<input type="color" bind:value={plot.color} onblur={save_graph_settings}/>
							<input id={"graph_" + g + "_plot_" + i + "_show_rules"} type="checkbox" bind:checked={plot.show_rules} onblur={save_graph_settings}/>
							<label for={"graph_" + g + "_plot_" + i + "_show_rules"}>Show Rules</label>
							<input type="button" value="&#xf1f8;" onclick={() => remove_plot(graph, i)}>
						</fieldset>
					{/each}
					<input type="button" value="Add Plot" onclick={() => add_plot(graph)}>
				</fieldset>
			{/each}
			<input type="button" value="Add Graph" onclick={() => add_graph_settings()}>
		</fieldset>
	</form>
	<form>
		<fieldset>
			<legend>Rules</legend>
			{#each rules as rule, i (rule)}
				<fieldset class="row">
					<input type="text" bind:value={rule.name} placeholder="Name" onblur={save_rules}>
					<input type="text" bind:value={rule.variable} placeholder="Variable" list="hourlyVariables" onblur={save_rules}>
					<input type="number" bind:value={rule.greater_than} placeholder="Greater Than (blank for unbounded)" onblur={save_rules}>
					<input type="number" bind:value={rule.less_than} placeholder="Less Than (blank for unbounded)" onblur={save_rules}>
					<input type="button" value="&#xf1f8;" onclick={() => remove_rule(i)}>
				</fieldset>
			{/each}
			<input type="button" value="Add Rule" onclick={() => add_rule("")}>
		</fieldset>
	</form>
</main>
