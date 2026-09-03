import type { Rule } from './rules.svelte'

import { Unit } from '@openmeteo/sdk/unit';
import type { Forecast } from './forecasts.svelte';

export type Result<T, E> = { ok: T } | { err: E };

export const dateFormatter = Intl.DateTimeFormat("en-CA", { hour12: false, month: "long", day: "numeric", "hour": "2-digit", minute: "2-digit", weekday: "short", });

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

export const no_default = (f: (event: Event) => any): (_: Event) => void => {
	return (event: Event) => {
		event.preventDefault();

		f(event)
	}
}

export function auto_timezone() {
	const offset_minutes = new Date().getTimezoneOffset();

	const prefix = Math.sign(-offset_minutes) >= 0 ? "+" : "-";
	const hours = Math.floor(Math.abs(-offset_minutes) / 60);
	const minutes = Math.abs(-offset_minutes) % 60;

	return "GMT" + prefix + hours + (minutes == 0 ? "" : ":" + minutes);
}

export interface Stats {
	violations: RuleViolation[],
}

export interface RuleViolation {
	name: string,
	start: Date,
	total_minutes: number,
}

export function collect_stats(rules: Rule[], variables: string[], forecast: Forecast, after: Date): Stats {
	let stats: Stats = { violations: [] };

	if (forecast.data.length == 0) {
		return stats;
	}

	const indices: Map<string, number> = variables.reduce(
		(map, name, index) => map.set(name, index),
		new Map(),
	);

	for (const rule of rules) {
		const i = indices.get(rule.variable);

		let violation = { name: rule.name, start: null as Date | null, total_minutes: 0 };

		if (i !== undefined) {
			forecast.data[i].data.forEach(
				(value, _) => {
					if ((rule.greater_than !== undefined && value[1] > rule.greater_than)
						|| (rule.less_than !== undefined && value[1] < rule.less_than)
					) {
						if (violation.start == null) {
							const date = value[0];
							if (date > after) {
								violation.start = date;
							} else {
								return;
							}
						}
						violation.total_minutes += forecast.interval_seconds / 60;
					}
				},
			);

			if (violation?.total_minutes > 0 && violation?.start != null) {
				stats.violations.push(violation);
			}
		} else {
			throw new Error("Variable defined in rule not fetched in forecast stats");
		}
	}

	return stats;
}

export function unit_short(unit: Unit): string {
	switch (unit) {
		case Unit.undefined: return "undefined";
		case Unit.celsius: return "°C";
		case Unit.fahrenheit: return "°F";
		case Unit.kelvin: return "°K";
		case Unit.kilometres_per_hour: return "km/h";
		case Unit.miles_per_hour: return "mp/h";
		case Unit.knots: return "kn";
		case Unit.metre_per_second: return "m/s";
		case Unit.metre_per_second_not_unit_converted: return "m/s";
		case Unit.millimetre: return "mm";
		case Unit.centimetre: return "cm";
		case Unit.inch: return "inch";
		case Unit.feet: return "ft";
		case Unit.metre: return "m";
		case Unit.geopotential_metre: return "gpm";
		case Unit.percentage: return "%";
		case Unit.hectopascal: return "hPa";
		case Unit.pascal: return "Pa";
		case Unit.degree_direction: return "°";
		case Unit.wmo_code: return "wmo code";
		case Unit.watt_per_square_metre: return "W/m²";
		case Unit.kilogram_per_square_metre: return "kg/m²";
		case Unit.gram_per_kilogram: return "g/kg";
		case Unit.per_second: return "s⁻¹";
		case Unit.seconds: return "s";
		case Unit.cubic_metre_per_cubic_metre: return "m³/m³";
		case Unit.cubic_metre_per_second: return "m³/s";
		case Unit.kilopascal: return "kPa";
		case Unit.megajoule_per_square_metre: return "MJ/m²";
		case Unit.joule_per_kilogram: return "J/kg";
		case Unit.hours: return "h";
		case Unit.iso8601: return "iso8601";
		case Unit.unix_time: return "unixtime";
		case Unit.micrograms_per_cubic_metre: return "μg/m³";
		case Unit.grains_per_cubic_metre: return "grains/m³";
		case Unit.dimensionless: return "";
		case Unit.dimensionless_integer: return "";
		case Unit.european_air_quality_index: return "EAQI";
		case Unit.us_air_quality_index: return "USAQI";
		case Unit.gdd_celsius: return "GGDc";
		case Unit.fraction: return "fraction";
		case Unit.parts_per_million: return "ppm";
		default: return "undefined";
	}
}

export function fixed_fractional_digits(unit: Unit): number {
	switch (unit) {
		case Unit.undefined: return 0;
		case Unit.celsius: return 1;
		case Unit.fahrenheit: return 1;
		case Unit.kelvin: return 1;
		case Unit.kilometres_per_hour: return 1;
		case Unit.miles_per_hour: return 1;
		case Unit.knots: return 1;
		case Unit.metre_per_second: return 2;
		case Unit.metre_per_second_not_unit_converted: return 2;
		case Unit.millimetre: return 2;
		case Unit.inch: return 3;
		case Unit.feet: return 3;
		case Unit.metre: return 2;
		case Unit.percentage: return 0;
		case Unit.hectopascal: return 1;
		case Unit.degree_direction: return 0;
		case Unit.wmo_code: return 0;
		case Unit.watt_per_square_metre: return 1;
		case Unit.cubic_metre_per_cubic_metre: return 3;
		case Unit.kilopascal: return 2;
		case Unit.megajoule_per_square_metre: return 2;
		case Unit.hours: return 1;
		case Unit.iso8601: return 0;
		case Unit.unix_time: return 0;
		case Unit.geopotential_metre: return 0;
		case Unit.kilogram_per_square_metre: return 2;
		case Unit.gram_per_kilogram: return 2;
		case Unit.per_second: return 2;
		case Unit.pascal: return 0;
		case Unit.centimetre: return 2;
		case Unit.seconds: return 2;
		case Unit.micrograms_per_cubic_metre: return 1;
		case Unit.grains_per_cubic_metre: return 1;
		case Unit.dimensionless: return 2;
		case Unit.dimensionless_integer: return 0;
		case Unit.joule_per_kilogram: return 1;
		case Unit.cubic_metre_per_second: return 2;
		case Unit.european_air_quality_index: return 0;
		case Unit.us_air_quality_index: return 0;
		case Unit.gdd_celsius: return 2;
		case Unit.fraction: return 3;
		case Unit.parts_per_million: return 0;
		default: return 0;
	}
}

export function format_variable(unit: Unit): (value: number) => string {
	return (value) => value.toFixed(fixed_fractional_digits(unit)) + " " + unit_short(unit);
}

export function* date_boundaries(forecast: Forecast): Generator<Date> {
	if (forecast.data === null) {
		return;
	}

	const start = forecast.data[0].data[0][0];
	const end = forecast.data[0].data[forecast.data[0].data.length - 1][0];

	for (let i = 0;; ++i) {
		const date = new Date(start);
		date.setDate(start.getDate() + i);

		if (date < end) {
			yield date;
		} else {
			break;
		}
	}
}

export function index_nearest(forecast: Forecast, date: Date): number | null {
	var min_dist = Infinity;
	var min_i = null;

	for (var i = 0; i < forecast.data[0].data.length; ++i) {
		const dist = Math.abs(Number(forecast.data[0].data[i][0]) - Number(date));
		if (dist < min_dist) {
			min_dist = dist;
			min_i = i;
		}
	}

	if (min_i != -1) {
		return min_i;
	} else {
		return null;
	}
}

export function notify(title: string, options?: NotificationOptions) {
	(async () => {
		if ("serviceWorker" in navigator) {
			const serviceWorker = await navigator.serviceWorker.ready;
			serviceWorker.showNotification(title, { icon: "/icon.svg", ...options });
		} else {
			new Notification(title, { icon: "/icon.svg", ...options });
		}
	})();
}
