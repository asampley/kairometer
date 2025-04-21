<script lang="ts">
	import { hourlyVariables } from "../main";
</script>

<datalist id="hourlyVariables">
	{#each hourlyVariables as v}
		<option value={v}></option>
	{/each}
</datalist>
