export const forecast_settings: ForecastSettings = $state(load_forecast_settings());
export const locations: Location[] = $state(load_locations());

export interface Rule {
	name: string,
	variable: string,
	greater_than?: number,
	less_than?: number,
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

function save(name: string, value: any): void {
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
		past_days: 0,
		forecast_days: 7,
	};

	if (fromStorage) {
		const loaded = JSON.parse(fromStorage);

		for (const k of ["latitude", "longitude", "past_days", "forecast_days"]) {
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
