export const forecast_settings: ForecastSettings = $state(load_forecast_settings());
export const locations: Location[] = $state(load_locations());
export const graph_settings: GraphSettings[] = $state(load_graph_settings());

export interface GraphSettings {
	name: string,
	plots: PlotSettings[],
}

export interface PlotSettings {
	color: string,
	variable: string,
	show_rules: boolean,
}

export interface ForecastSettings {
	past_days: number,
	forecast_days: number,
}

export interface Location {
	name: string,
	latitude: number,
	longitude: number,
}

export function save(name: string, value: any): void {
	console.log("Saved '" + name + "'");

	localStorage.setItem(name, JSON.stringify(value));
}

export function load_locations(): Location[] {
	const fromStorage = localStorage.getItem("locations");

	let locations = [
		{
			name: "Edmonton",
			latitude: 53.5501,
			longitude: -113.4687,
		},
	];

	if (fromStorage) {
		const loaded = JSON.parse(fromStorage);

		locations = [];

		for (const v of loaded) {
			if (!("longitude" in v && "latitude" in v)) {
				continue;
			}

			if (!("name" in v)) {
				v.name = "";
			}

			locations.push(v);
		}
	}

	return locations;
}

export function save_locations() {
	save("locations", locations);
}

export function load_forecast_settings(): ForecastSettings {
	const fromStorage = localStorage.getItem("forecast_settings");

	let settings = {
		past_days: 1,
		forecast_days: 7,
	};

	if (fromStorage) {
		const loaded = JSON.parse(fromStorage);

		for (const k of ["past_days", "forecast_days"]) {
			if (k in loaded) {
				settings[k] = loaded[k];
			}
		}
	}

	return settings;
}

export function save_forecast_settings() {
	save("forecast_settings", forecast_settings);
}

export function load_graph_settings(): GraphSettings[] {
	const fromStorage = localStorage.getItem("graph_settings");

	if (fromStorage) {
		const loaded = JSON.parse(fromStorage);

		if (loaded instanceof Array) {
			return loaded;
		}
	}

	return [
		{
			name: "Precipitation",
			plots: [
				{
					color: "#3584E4",
					variable: "rain",
					show_rules: true,
				},
				{
					color: "#99C1F1",
					variable: "snowfall",
					show_rules: true,
				},
			],
		},
		{
			name: "Atmosphere",
			plots: [
				{
					color: "#5E5C64",
					variable: "surface_pressure",
					show_rules: true,
				},
				{
					color: "#8FF0A4",
					variable: "wind_speed_10m",
					show_rules: true,
				},
			],
		}
	];
}

export function save_graph_settings() {
	save("graph_settings", graph_settings);
}
