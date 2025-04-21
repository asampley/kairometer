import type { WeatherApiResponse } from '@openmeteo/sdk/weather-api-response';
import type { Rule } from './rules.svelte'

import { fetchWeatherApi } from 'openmeteo';

export type Result<T, E> = { ok: T } | { err: E };

export const hourlyVariables: string[] = [
	"temperature_2m",
	"relative_humidity_2m",
	"dew_point_2m",
	"apparent_temperature",
	"pressure_msl",
	"surface_pressure",
	"cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
	"wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m",
	"wind_direction_10m", "wind_direction_80m", "wind_direction_120m", "wind_direction_180m",
	"wind_gusts_10m",
	"shortwave_radiation",
	"direct_radiation",
	"direct_normal_irradiance",
	"diffuse_radiation",
	"global_tilted_irradiance",
	"vapour_pressure_deficit",
	"cape",
	"evapotranspiration", "et0_fao_evapotranspiration",
	"precipitation",
	"snowfall",
	"precipitation_probability",
	"rain",
	"showers",
	"weather_code",
	"snow_depth",
	"freezing_level_height",
	"visibility",
	"soil_temperature_0cm", "soil_temperature_6cm", "soil_temperature_18cm", "soil_temperature_54cm",
	"soil_moisture_0_to_1cm", "soil_moisture_1_to_3cm","soil_moisture_3_to_9cm","soil_moisture_9_to_27cm","soil_moisture_27_to_81cm",
	"is_day",
]

export const no_default = (f: () => any): (_: Event) => void => {
	return (event: Event) => {
		event.preventDefault();

		f()
	}
}

export function get_forecast(hourly: string[]): Promise<WeatherApiResponse[]> {
	const params = {
		latitude: 53.5501,
		longitude: -113.4687,
		hourly: hourly,
		timezone: "auto",
		format: "flatbuffers",
	};

	let url = "https://api.open-meteo.com/v1/forecast";

	return fetchWeatherApi(url, params)
}

export interface Stats {
	violations: RuleViolation[],
}

export interface RuleViolation {
	name: string,
	total_minutes: number,
}

export function collect_stats(rules: Rule[], variables: string[], forecast: WeatherApiResponse): Stats {
	const indices: Map<string, number> = variables.reduce(
		(map, name, index) => map.set(name, index),
		new Map(),
	);

	let stats: Stats = { violations: [] };

	for (const rule of rules) {
		const i = indices.get(rule.variable);

		let violation = { name: rule.name, total_minutes: 0 };

		if (i !== null) {
			forecast.hourly()?.variables(i)?.valuesArray()?.forEach(
				(value) => {
					if ((rule.greater_than !== null && value > rule.greater_than)
						|| (rule.less_than !== null && value < rule.less_than)
					) {
						violation.total_minutes += 15;
					}
				},
			);

			if (violation?.total_minutes > 0) {
				stats.violations.push(violation);
			}
		} else {
			throw new Error("Variable defined in rule not fetched in forecast stats");
		}
	}

	return stats;
}

export function graph_data(i: number, forecast: WeatherApiResponse): [number, number][] {
	return forecast.hourly()?.variables(i)?.valuesArray()?.values().map((v, i) => [i, v] as [number, number]).toArray() || [];
}
