<script lang="ts">
	import DataLists from "../../components/DataLists.svelte";
	import Title from "../../components/Title.svelte";
	import Nav from "../../components/Nav.svelte";

	import { rules, add_rule, remove_rule, save_rules } from "../../rules.svelte";
	import { forecast_settings, save_forecast_settings } from "../../settings.svelte";
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
				<label for="latitude">Latitude</label><br>
				<input id="latitude" type="text" bind:value={forecast_settings.latitude} placeholder="53.5501," onblur={save_forecast_settings}><br>
				<label for="longitude">Longitude</label><br>
				<input id="longitude" type="text" bind:value={forecast_settings.longitude} placeholder="-113.4687" onblur={save_forecast_settings}><br>
				<label for="past_days">Past Days</label><br>
				<input id="past_days" type="number" bind:value={forecast_settings.past_days} placeholder="0" onblur={save_forecast_settings}><br>
				<label for="forecast_days">Forecast Days</label><br>
				<input id="forecast_days" type="number" bind:value={forecast_settings.forecast_days} placeholder="7" onblur={save_forecast_settings}><br>
			</fieldset>
		</fieldset>
	</form>
</main>
