<script lang="ts">
	import PlotLine from "./PlotLine.svelte";
	import { dateFormatter } from "../main";

	let { plots, markX, ...others }: {
		plots: { color: string, name: string, data: [number | Date, number][], markY: number[], format: (y: number) => string}[],
		markX: { color: string, values: (number | Date)[] }[],
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

	function mouseToGraphX(mouse: [number, number], data: [number | Date, number][]): number {
		return mouseToIndex(mouse, data) * width / (data.length - 1);
	}

	function mouseToGraph(mouse: [number, number], data: [number | Date, number][], plot_i: number): [number, number] {
		let i = mouseToIndex(mouse, data);

		return [mouseToGraphX(mouse, data),  (1 - (data[i][1] - axisY[plot_i][0]) / DY[plot_i]) * height]
	}

	let markerPositions: ([number, number] | null)[] = $derived(plots.map(_ => null));
	let textPosition: [number, number] | null = $state(null);
	let textAnchor: "start" | "end" = $state("start");
	let textDy = $state("-1.2em");
	let texts: string[] | null = $state(null);

	function onpointermove(event: MouseEvent) {
		const mouse: [number, number] = [event.offsetX, event.offsetY];

		// TODO grabbing the first may not always be the correct choice
		const data = plots[0].data;
		const point = data[mouseToIndex(mouse, data)];

		markerPositions = plots.map((plot, i) => mouseToGraph(mouse, plot.data, i));
		const graphX = mouseToGraphX(mouse, data);
		textAnchor = graphX < width / 2 ? "start" : "end";
		textPosition = [graphX + (textAnchor == "start" ? 16 : -16), mouse[1] < 0.5 * height ? height : 0];

		texts = [];
		if (point[0] instanceof Date) {
			texts.push(dateFormatter.format(point[0]));
		} else {
			texts.push(point[0].toFixed(2));
		}

		texts.push(...plots.map(plot => plot.format(plot.data[mouseToIndex(mouse, data)][1])));

		textDy = textPosition[1] < height / 2 ? "1.2em" : (-0.2 - texts.length) + "em";
	}

	function onpointerleave() {
		textPosition = null;
	}
</script>

<svg role="presentation" style="background-color:black;touch-action:pinch-zoom pan-y;" {onpointermove} {onpointerleave} bind:clientWidth={width} bind:clientHeight={height} {...others}>
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
		{#if texts != null}
			<text y={textPosition[1]} text-anchor={textAnchor} style="stroke:black; stroke-width:0.5em; fill:white; paint-order:stroke; stroke-linejoin:round" pointer-events="none">
				{#each texts as text, t_i}
					<tspan x="{textPosition[0]}" dy={t_i == 0 ? textDy : "1.2em"} pointer-events="none">{text}</tspan>
				{/each}
			</text>
		{/if}
	{/if}
</svg>
