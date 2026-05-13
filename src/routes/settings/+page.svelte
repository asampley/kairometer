<script lang="ts">
	import DataLists from "../../components/DataLists.svelte";
	import Title from "../../components/Title.svelte";
	import Nav from "../../components/Nav.svelte";

	import { rules, add_rule, remove_rule, save_rules } from "../../rules.svelte";
	import { forecast_settings, locations, save_forecast_settings, save_locations } from "../../settings.svelte";

	function add_location() {
		locations.push({
			name: "New location",
			longitude: 0,
			latitude: 0,
		});

		save_locations();
	}

	function remove_location(i: number) {
		locations.splice(i, 1);
		save_locations();
	}
</script>

<main class="container">
	<Title/>
	<Nav/>
	<DataLists/>
	<p>Take a look at <a href="https://open-meteo.com/en/docs">https://open-meteo.com/en/docs</a> for more detailed description and listing of the variables available, as well as a description of the data sources.</p>
	<form>
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
					<button onclick={() => remove_location(i) }>X</button>
				</fieldset>
			{/each}
			<button onclick={() => add_location() }>Add Location</button>
		</fieldset>
	</form>
</main>
