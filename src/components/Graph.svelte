<script lang="ts">
	import PlotLine from "./PlotLine.svelte";

	let { data, markX, markY, formatY, ...others }: {
		data: [number | Date, number][],
		markX: { color: string, values: (number | Date)[] }[],
		markY: number[],
		formatY: (y: number) => string,
	} = $props();

	const dateFormatter = Intl.DateTimeFormat("en-CA", { hour12: false, month: "long", day: "numeric", "hour": "2-digit", minute: "2-digit", weekday: "short", });

	let axisX: [number, number] = $derived.by(() => {
		if (data.length == 0) {
			return [0, 1];
		} else {
			return data.values().reduce(
				(range, value) => [
					Math.min(range[0], value[0].valueOf()),
					Math.max(range[1], value[0].valueOf())
				],
				[data[0][0].valueOf(), data[0][0].valueOf()]
			);
		}
	});
	let axisY: [number, number] = $derived.by(() => {
		if (data.length == 0) {
			return [0, 1];
		} else {
			let bounds = data.values().reduce((range, value) => [Math.min(range[0], value[1]), Math.max(range[1], value[1])], [data[0][1], data[0][1]]);

			if (markY && markY.length > 0) {
				bounds[0] = Math.min(bounds[0], ...markY);
				bounds[1] = Math.max(bounds[1], ...markY);
			}

			let delta = bounds[1] - bounds[0];

			return [bounds[0] - delta * 0.1, bounds[1] + delta * 0.1];
		}
	});

	let DX = $derived(axisX[1] - axisX[0]);
	let DY = $derived(axisY[1] - axisY[0]);

	let width = $state(0);
	let height = $state(0);

	const normalizeX = (x: number) => (x - axisX[0]) / DX;
	const normalizeY = (y: number) => 1 - (y - axisY[0]) / DY;

	let normalizedData = $derived(
		data.values().map((v) => [normalizeX(v[0].valueOf()), normalizeY(v[1])] as [number, number]).toArray()
	);

	function mouseToIndex(mouse: [number, number]): number {
		return Math.round(mouse[0] * (data.length - 1) / width)
	}

	function mouseToGraph(mouse: [number, number]): [number, number] {
		let i = mouseToIndex(mouse);

		return [i * width / (data.length - 1),  (1 - (data[i][1] - axisY[0]) / DY) * height]
	}

	let textPosition: [number, number] | null = $state(null);
	let textAnchor: "start" | "middle" | "end" = $state("start");
	let textDy = $state("-1.2em");
	let text0: string | null = $state(null);
	let text1: string | null = $state(null);

	function onmousemove(event: MouseEvent) {
		const mouse: [number, number] = [event.offsetX, event.offsetY];

		const point = data[mouseToIndex(mouse)];

		textPosition = mouseToGraph(mouse);
		textAnchor = textPosition[0] < width / 3 ? "start" : textPosition[0] < width * 2 / 3 ? "middle" : "end";
		textDy = textPosition[1] < height / 2 ? "1.2em" : "-2.2em";

		if (point[0] instanceof Date) {
			text0 = dateFormatter.format(point[0]);
		} else {
			text0 = point[0].toFixed(2);
		}

		text1 = formatY(point[1]);
	}

	function onmouseleave() { textPosition = null; }
	function onpointerleave() { textPosition = null; }
</script>

<svg role="presentation" style="background-color:black;" {onmousemove} {onmouseleave} {onpointerleave} bind:clientWidth={width} bind:clientHeight={height} {...others}>
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
		{#each markY as y}
			<line x1=0 x2={width} y1={normalizeY(y)} y2={normalizeY(y)} vector-effect="non-scaling-stroke" stroke="cyan" stroke-dasharray="4 4" stroke-width="2px"/>
		{/each}
		<PlotLine stroke="red" data={normalizedData}/>
	</svg>
	<!--Non-scaling section-->
	{#if textPosition}
		<circle fill="red" stroke="palevioletred" stroke-width="0.25rem" cx={textPosition[0]} cy={textPosition[1]} r="0.6rem"/>
		{#if text0 || text1}
			<text y={textPosition[1]} text-anchor={textAnchor} style="stroke:black; stroke-width:0.5em; fill:white; paint-order:stroke; stroke-linejoin:round" pointer-events="none">
				<tspan x="{textPosition[0]}" dy={textDy}>{text0}</tspan>
				<tspan x="{textPosition[0]}" dy="1.2em">{text1}</tspan>
			</text>
		{/if}
	{/if}
</svg>
