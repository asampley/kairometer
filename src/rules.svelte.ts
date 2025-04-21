export const rules: Rule[] = $state([]);

export interface Rule {
	name: string,
	variable: string,
	greater_than?: number,
	less_than?: number,
}

export function add_rule(
	name: string,
	variable?: string,
	greater_than?: number,
	less_than?: number
) {
	rules.push({
		name: name,
		variable: variable || "",
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
			rules.splice(0, rules.length);

			rules.push(...JSON.parse(fromStorage));

			return;
		}
	}

	// Default
	rules.push({ name: "High Pressure", variable: "surface_pressure", greater_than: 1000 });
	rules.push({ name: "Rain", variable: "rain", greater_than: 1 });
}

export function save_rules() {
	console.log("Saved");

	localStorage.setItem("rules", JSON.stringify(rules));
}
