export const rules: Rule[] = $state(load_rules());

export interface Rule {
	name: string,
	variable: string,
	greater_than?: number,
	less_than?: number,
}

export function add_rule(
	name: string,
	variable: string = "",
	greater_than?: number,
	less_than?: number
) {
	rules.push({
		name: name,
		variable: variable ,
		greater_than: greater_than,
		less_than: less_than,
	});
	save_rules();
}

export function remove_rule(i: number) {
	rules.splice(i, 1)[0];
	save_rules();
}

export function load_rules() {
	const fromStorage = localStorage.getItem("rules");

	if (fromStorage) {
		const loadedRules = JSON.parse(fromStorage);

		if (loadedRules instanceof Array) {
			return loadedRules;
		}
	}

	// Default
	return [
		{ name: "High Pressure", variable: "surface_pressure", greater_than: 1000 },
		{ name: "Rain", variable: "rain", greater_than: 1 },
	];
}

export function save_rules() {
	console.log("Saved");

	localStorage.setItem("rules", JSON.stringify(rules));
}
