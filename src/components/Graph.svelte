<script lang="ts">
	import PlotLine from "./PlotLine.svelte";

	let { data, markY, ...others }: { data: [number, number][], markY: number[] } = $props();

	let axisX: [number, number] = $derived.by(() => {
		if (data.length == 0) {
			return [0, 1];
		} else {
			return data.values().reduce((range, value) => [Math.min(range[0], value[0]), Math.max(range[1], value[0])], [data[0][0], data[0][0]]);
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
		data.values().map((v) => [normalizeX(v[0]), normalizeY(v[1])] as [number, number]).toArray()
	);

	function mouseToIndex(mouse: [number, number]): number {
		return Math.round(mouse[0] * (data.length - 1) / width)
	}

	function mouseToGraph(mouse: [number, number]): [number, number] {
		let i = mouseToIndex(mouse);

		return [i * width / (data.length - 1),  (1 - (data[i][1] - axisY[0]) / DY) * height]
	}

	let textV: [number, number] | null = $state(null);
	let text: string | null = $state(null);

	function onmousemove(event: MouseEvent) {
		const mouse: [number, number] = [event.offsetX, event.offsetY];

		textV = mouseToGraph(mouse);
		text = data[mouseToIndex(mouse)][1].toString();
	}

	function onmouseleave() { textV = null; }
	function onpointerleave() { textV = null; }
</script>

<svg role="presentation" style="background-color:black;" {onmousemove} {onmouseleave} {onpointerleave} bind:clientWidth={width} bind:clientHeight={height} {...others}>
	<!--Scaling section-->
	<svg viewBox="0 0 1 1" preserveAspectRatio="none">
		<PlotLine stroke="red" data={normalizedData}/>
		{#each markY as y}
			<line x1=0 x2={width} y1={normalizeY(y)} y2={normalizeY(y)} vector-effect="non-scaling-stroke" stroke="cyan" stroke-dasharray="4" stroke-width="1px"/>
		{/each}
	</svg>
	<!--Non-scaling section-->
	{#if textV}
		<circle fill="red" stroke="palevioletred" stroke-width="0.25rem" cx={textV[0]} cy={textV[1]} r="0.6rem"/>
		{#if text}
			<text x={textV[0]} y={textV[1]} style="stroke:black; stroke-width:0.5em; fill:white; paint-order:stroke; stroke-linejoin:round">{text}</text>
		{/if}
	{/if}
</svg>
