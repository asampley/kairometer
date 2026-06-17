<script lang="ts">
	import PlotLine from "./PlotLine.svelte";
	import { dateFormatter } from "../main";
	import { onMount } from "svelte";

	let { plots, markX, defaultMarkerX, ...others }: {
		plots: { color: string, name: string, data: [number | Date, number][], markY: number[], format: (y: number) => string}[],
		markX: { color: string, values: (number | Date)[] }[],
		defaultMarkerX?: number | Date,
		[key: string]: any,
	} = $props();

	let axisX: [number, number] = $derived.by(() => {
		return plots.values().reduce(
			(acc, plot) => {
				const data_bounds = plot.data.values().reduce<[number, number]>(
					(range, value) => [
						Math.min(range[0], value[0].valueOf()),
						Math.max(range[1], value[0].valueOf())
					],
					[Infinity, -Infinity]
				);

				return [
					Math.min(data_bounds[0], acc[0]),
					Math.max(data_bounds[1], acc[1]),
				];
			},
			[Infinity, -Infinity]
		);
	});

	// separate axis for each plot
	let axisY: [number, number][] = $derived.by(() => plots.values().map<[number, number]>(
		plot => {
			const bounds = plot.data.values().reduce<[number, number]>(
				(range, value) => [
					Math.min(range[0], value[1]),
					Math.max(range[1], value[1])
				],
				[Infinity, -Infinity]
			);

			if (plot.markY && plot.markY.length > 0) {
				bounds[0] = Math.min(bounds[0], ...plot.markY);
				bounds[1] = Math.max(bounds[1], ...plot.markY);
			}

			if (bounds[0] == Infinity) {
				bounds[0] = 0;
			}

			if (bounds[1] == -Infinity) {
				bounds[1] = 1;
			}

			if (bounds[1] == bounds[0]) {
				bounds[1] += 1;
			}

			let delta = bounds[1] - bounds[0];

			return [bounds[0] - delta * 0.1, bounds[1] + delta * 0.1];
		}
	).toArray());

	let DX = $derived(axisX[1] - axisX[0]);
	let DY = $derived(axisY.map(a => a[1] - a[0]));

	let width = $state(0);
	let height = $state(0);

	const normalizeX = (x: number) => (x - axisX[0]) / DX;
	const normalizeY = (y: number, plot_i: number) => 1 - (y - axisY[plot_i][0]) / DY[plot_i];

	let normalizedData = $derived(
		plots.values().map((plot, plot_i) => plot.data.values().map((v) => [normalizeX(v[0].valueOf()), normalizeY(v[1], plot_i)] as [number, number]).toArray()).toArray()
	);

	function mouseToIndex(mouse: [number, number], data: [number | Date, number][]): number {
		return Math.round(mouse[0] * (data.length - 1) / width)
	}

	function indexToX(i: number, data: [number | Date, number][]): number {
		return i * width / (data.length - 1);
	}

	function indexToY(i: number, data: [number | Date, number][], plot_i: number): number {
		return (1 - (data[i][1] - axisY[plot_i][0]) / DY[plot_i]) * height;
	}

	let markerPositions: ([number, number] | null)[] = $derived(plots.map(_ => null));
	let textPosition: [number, number] | null = $state(null);
	let textAnchor: "start" | "end" = $state("start");
	let textDy = $state("-1.2em");
	let xLabel: string | null = $state(null);
	let yLabels: [string, string][] = $state([]);

	function setMarkerDefault() {
		if (defaultMarkerX != null) {
			var min_dist = Infinity;
			var min_i = 0;

			for (var i = 0; i < plots[0].data.length; ++i) {
				const dist = Math.abs(Number(plots[0].data[i][0]) - Number(defaultMarkerX));
				if (dist < min_dist) {
					min_dist = dist;
					min_i = i;
				}
			}

			setMarker(min_i, true);
		} else {
			//textPosition = null;
		}
	}

	function setMarker(i: number, top: boolean) {
		markerPositions = plots.map((plot, plot_i) => [indexToX(i, plot.data), indexToY(i, plot.data, plot_i)]);

		// TODO grabbing the first may not always be the correct choice
		const data_0 = plots[0].data;
		const x = i * width / (data_0.length - 1);

		textAnchor = x < width / 2 ? "start" : "end";
		textPosition = [x + (textAnchor == "start" ? 16 : -16), top ? 0 : height];

		const point = data_0[i];

		if (point[0] instanceof Date) {
			xLabel = dateFormatter.format(point[0]);
		} else {
			xLabel = point[0].toFixed(2);
		}

		yLabels = plots.map(plot => [plot.name, plot.format(plot.data[i][1])]);

		textDy = textPosition[1] < height / 2 ? "1.2em" : (-1.2 - yLabels.length) + "em";
	}

	function onpointermove(event: MouseEvent) {
		const mouse: [number, number] = [event.offsetX, event.offsetY];

		// TODO grabbing the first may not always be the correct choice
		const data = plots[0].data;

		setMarker(mouseToIndex(mouse, data), mouse[1] >= 0.5 * height);
	}

	function onmouseleave() {
		setMarkerDefault()
	}

	onMount(setMarkerDefault);
</script>

<svg role="presentation" style="background-color:black;touch-action:pinch-zoom pan-y;" {onpointermove} {onmouseleave} bind:clientWidth={width} bind:clientHeight={height} {...others}>
	<!--Scaling section-->
	<svg viewBox="0 0 1 1" preserveAspectRatio="none">
		{#each markX as mark}
			{#each mark.values as x}
				<line
					x1={normalizeX(x.valueOf())} x2={normalizeX(x.valueOf())}
					y1=0 y2={height}
					vector-effect="non-scaling-stroke" stroke={mark.color} stroke-width="2px"
				/>
			{/each}
		{/each}
		{#each plots as plot, p_i}
			<PlotLine stroke={plot.color} data={normalizedData[p_i]}/>
			{#each plot.markY as y}
				<line x1=0 x2={width} y1={normalizeY(y, p_i)} y2={normalizeY(y, p_i)} vector-effect="non-scaling-stroke" stroke={plot.color} stroke-dasharray="4 4" stroke-width="2px"/>
			{/each}
		{/each}
	</svg>
	<!--Non-scaling section-->
	{#if textPosition}
		{#each markerPositions as markerPosition, i}
			{#if markerPosition != null}
				<circle fill={plots[i].color} stroke={plots[i].color} stroke-opacity="0.5" stroke-width="0.5rem" cx={markerPosition[0]} cy={markerPosition[1]} r="0.3rem"/>
			{/if}
		{/each}
		{#if xLabel != null}
			<text y={textPosition[1]} text-anchor={textAnchor} style="stroke:black; stroke-width:0.5em; fill:white; paint-order:stroke; stroke-linejoin:round" pointer-events="none">
				<tspan x={textPosition[0]} dy={textDy}>{xLabel}</tspan>
				{#each yLabels as yLabel, y_i}
					<tspan x={textPosition[0]} fill={plots[y_i].color} dy="1.2em" pointer-events="none">
						<tspan>{plots[y_i].name + ": "}</tspan>
						<tspan>{yLabel[1]}</tspan>
					</tspan>
				{/each}
			</text>
		{/if}
	{/if}
</svg>
