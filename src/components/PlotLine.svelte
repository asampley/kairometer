<script lang="ts">
	let { data, stroke, ...others }: { data: [number, number][], stroke: string } = $props();

	let d = $derived.by(() => {
		let iter = data.values();

		let point = iter.next().value;

		let v;
		if (point) {
			v = "M " + point[0] + " " + point[1];
		} else {
			return null;
		}

		while (point = iter.next().value) {
			v += " L " + point[0] + " " + point[1];
		}

		return v;
	});
</script>

<path {d} {stroke} stroke-width="2px" fill="none" vector-effect="non-scaling-stroke" {...others}/>
