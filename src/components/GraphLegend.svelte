<script lang="ts">
	let props: {
		textPosition: [number, number],
		textAnchor: string,
		textDy: string,
		xLabel: string,
		yLabels: {
			name: string,
			value: string,
			color: string,
		}[]
	} = $props();

</script>
<svg>
	<text y={props.textPosition[1]} text-anchor={props.textAnchor} style="stroke:black; stroke-width:0.5em; fill:white; paint-order:stroke; stroke-linejoin:round" pointer-events="none">
		<tspan x={props.textPosition[0]} dy={props.textDy}>{props.xLabel}</tspan>
		{#each props.yLabels as yLabel}
			<tspan x={props.textPosition[0]} fill={yLabel.color} dy="1.2em" pointer-events="none">
				<tspan>{yLabel.name + ": "}</tspan>
				<tspan>{yLabel.value}</tspan>
			</tspan>
		{/each}
	</text>
</svg>
