export const forecast_settings: ForecastSettings = $state(load_forecast_settings());

export interface Rule {
	name: string,
	variable: string,
	greater_than?: number,
	less_than?: number,
}

export interface ForecastSettings {
	latitude: number,
	longitude: number,
	past_days: number,
	forecast_days: number,
}

export function load_forecast_settings(): ForecastSettings {
	const fromStorage = localStorage.getItem("forecast_settings");

	let settings = {
		latitude: 53.5501,
		longitude: -113.4687,
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
	console.log("Saved");

	localStorage.setItem("forecast_settings", JSON.stringify(forecast_settings));
}
