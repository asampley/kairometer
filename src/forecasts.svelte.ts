import { type WeatherApiResponse } from "@openmeteo/sdk/weather-api-response";
import { clear, forecast_settings, locations, reviver, save, type ForecastSettings, type Location } from "./settings.svelte";
import { fetchWeatherApi } from "openmeteo";
import { Unit } from "@openmeteo/sdk/unit";

export interface Forecast {
	query_variables: string[],
	time: Date,
	interval_seconds: number,
	data: ForecastData[],
}

export interface ForecastData {
	unit: Unit,
	data: [Date, number][],
}

export const forecasts: (Forecast | null)[] = $state(load_forecasts());

export async function update_forecast(variables: string[], location_i: number) {
	const next = await get_forecast(variables, forecast_settings, locations[location_i]);

	forecasts[location_i] = {
		query_variables: variables,
		time: new Date(),
		interval_seconds: next[0].hourly()!.interval(),
		data: parse_data(next[0]),
	};
}

export function get_forecast(hourly: string[], forecast_settings: ForecastSettings, location: Location): Promise<WeatherApiResponse[]> {
	const params = {
		latitude: location.latitude,
		longitude: location.longitude,
		hourly: hourly,
		timezone: "auto",
		format: "flatbuffers",
		forecast_days: forecast_settings.forecast_days,
		past_days: forecast_settings.past_days,
	};

	let url = "https://api.open-meteo.com/v1/forecast";

	return fetchWeatherApi(url, params);
}

export function get_historical(hourly: string[], forecast_settings: ForecastSettings, location: Location): Promise<WeatherApiResponse[]> {
	const start_date = new Date();
	start_date.setDate(start_date.getDate() - forecast_settings.past_days);

	const end_date = new Date();

	const params = {
		latitude: location.latitude,
		longitude: location.longitude,
		hourly: hourly,
		timezone: "auto",
		format: "flatbuffers",
		start_date: start_date.getFullYear() + "-" + (start_date.getMonth() + 1).toString().padStart(2, "0") + "-" + (start_date.getDate()).toString().padStart(2, "0"),
		end_date: end_date.getFullYear() + "-" + (end_date.getMonth() + 1).toString().padStart(2, "0") + "-" + (end_date.getDate()).toString().padStart(2, "0"),
	};

	let url = "https://archive-api.open-meteo.com/v1/archive";

	return fetchWeatherApi(url, params);
}

export function load_forecasts(): (Forecast | null)[] {
	const fromStorage = localStorage.getItem("forecasts");

	if (fromStorage) {
		return JSON.parse(fromStorage, reviver);
	} else {
		return locations.map(_ => null);
	}
}

function parse_data(weather: WeatherApiResponse): ForecastData[] {
	const hourly = weather.hourly();

	if (hourly === null) {
		return [];
	}

	let lines = new Array();

	for (var i = 0; i < hourly.variablesLength(); ++i) {
		const values = hourly.variables(i)?.valuesArray()?.values();
		const unit = hourly.variables(i)?.unit() ?? Unit.undefined;

		lines.push({
			unit: unit,
			data: values?.map((v, i) => [new Date((Number(hourly.time()) + i * hourly.interval()) * 1000), v] as [Date, number]).toArray() || [],
		})
	}

	console.log(lines);

	return lines;
}

export function parse_unit(i: number, forecast: WeatherApiResponse): Unit {
	return forecast.hourly()?.variables(i)?.unit() ?? Unit.undefined;
}

export function graph_variable_index(name: string, forecast: Forecast): number | null {
	const index = forecast.query_variables.indexOf(name);
	return index == -1 ? null : index;
}

export function save_forecasts() {
	save("forecasts", forecasts);
}

export function clear_forecasts() {
	for (var i = 0; i < forecasts.length; ++i) {
		forecasts[i] = null;
	}

	clear("forecasts");
}
