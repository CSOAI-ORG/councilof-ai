import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    postcode?: string;
  };
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    weatherDescription: string;
    isDay: boolean;
  };
  daily: {
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    precipitationSum: number;
    precipitationProbability: number;
    windSpeedMax: number;
    weatherCode: number;
    weatherDescription: string;
    sunrise: string;
    sunset: string;
  }[];
  alerts: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedDays: string[];
  }[];
}

// Weather code descriptions based on WMO codes
const weatherCodes: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

// UK postcode to approximate coordinates lookup
async function postcodeToCoords(postcode: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Use postcodes.io API (free, no key required)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        return {
          lat: data.result.latitude,
          lon: data.result.longitude,
        };
      }
    }
    
    // Fallback: try partial postcode
    const partialPostcode = cleanPostcode.substring(0, cleanPostcode.length - 3).trim();
    const partialResponse = await fetch(`https://api.postcodes.io/outcodes/${partialPostcode}`);
    
    if (partialResponse.ok) {
      const partialData = await partialResponse.json();
      if (partialData.result) {
        return {
          lat: partialData.result.latitude,
          lon: partialData.result.longitude,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting postcode:', error);
    return null;
  }
}

function generateAlerts(dailyData: any): WeatherData['alerts'] {
  const alerts: WeatherData['alerts'] = [];
  const today = new Date().toISOString().split('T')[0];
  
  dailyData.time.forEach((date: string, index: number) => {
    const precip = dailyData.precipitation_sum[index];
    const windSpeed = dailyData.wind_speed_10m_max[index];
    const weatherCode = dailyData.weather_code[index];
    const tempMin = dailyData.temperature_2m_min[index];
    
    // Heavy rain alert
    if (precip > 10) {
      const existing = alerts.find(a => a.type === 'heavy_rain');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'heavy_rain',
          severity: precip > 20 ? 'high' : 'medium',
          message: `Heavy rainfall expected (${precip.toFixed(1)}mm) - may affect site access and excavation work`,
          affectedDays: [date],
        });
      }
    }
    
    // High wind alert
    if (windSpeed > 50) {
      const existing = alerts.find(a => a.type === 'high_wind');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'high_wind',
          severity: windSpeed > 70 ? 'high' : 'medium',
          message: `High winds expected (${windSpeed.toFixed(0)} km/h) - consider postponing lifting operations`,
          affectedDays: [date],
        });
      }
    }
    
    // Freezing conditions
    if (tempMin < 0) {
      const existing = alerts.find(a => a.type === 'freezing');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'freezing',
          severity: tempMin < -5 ? 'high' : 'medium',
          message: `Freezing conditions expected (${tempMin.toFixed(0)}°C) - watch for ice on roads and frozen ground`,
          affectedDays: [date],
        });
      }
    }
    
    // Snow alert
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      const existing = alerts.find(a => a.type === 'snow');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'snow',
          severity: [75, 86].includes(weatherCode) ? 'high' : 'medium',
          message: 'Snowfall expected - may affect site access and vehicle movement',
          affectedDays: [date],
        });
      }
    }
    
    // Fog alert
    if ([45, 48].includes(weatherCode)) {
      const existing = alerts.find(a => a.type === 'fog');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'fog',
          severity: 'low',
          message: 'Fog expected - reduced visibility may affect driving conditions',
          affectedDays: [date],
        });
      }
    }
    
    // Thunderstorm alert
    if ([95, 96, 99].includes(weatherCode)) {
      const existing = alerts.find(a => a.type === 'thunderstorm');
      if (existing) {
        existing.affectedDays.push(date);
      } else {
        alerts.push({
          type: 'thunderstorm',
          severity: 'high',
          message: 'Thunderstorms expected - suspend outdoor work and seek shelter',
          affectedDays: [date],
        });
      }
    }
  });
  
  return alerts;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postcode, latitude, longitude } = await req.json();
    
    let lat: number;
    let lon: number;
    let resolvedPostcode = postcode;
    
    // Get coordinates
    if (latitude && longitude) {
      lat = latitude;
      lon = longitude;
    } else if (postcode) {
      const coords = await postcodeToCoords(postcode);
      if (!coords) {
        return new Response(
          JSON.stringify({ error: 'Could not resolve postcode to coordinates' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      lat = coords.lat;
      lon = coords.lon;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either postcode or latitude/longitude required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
    
    // Fetch from Open-Meteo API (free, no API key required)
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', lat.toString());
    weatherUrl.searchParams.set('longitude', lon.toString());
    weatherUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day');
    weatherUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset');
    weatherUrl.searchParams.set('timezone', 'Europe/London');
    weatherUrl.searchParams.set('forecast_days', '7');
    
    const weatherResponse = await fetch(weatherUrl.toString());
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.statusText}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Transform to our format
    const result: WeatherData = {
      location: {
        latitude: lat,
        longitude: lon,
        postcode: resolvedPostcode,
      },
      current: {
        temperature: weatherData.current.temperature_2m,
        apparentTemperature: weatherData.current.apparent_temperature,
        humidity: weatherData.current.relative_humidity_2m,
        precipitation: weatherData.current.precipitation,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        weatherCode: weatherData.current.weather_code,
        weatherDescription: weatherCodes[weatherData.current.weather_code] || 'Unknown',
        isDay: weatherData.current.is_day === 1,
      },
      daily: weatherData.daily.time.map((date: string, index: number) => ({
        date,
        temperatureMax: weatherData.daily.temperature_2m_max[index],
        temperatureMin: weatherData.daily.temperature_2m_min[index],
        precipitationSum: weatherData.daily.precipitation_sum[index],
        precipitationProbability: weatherData.daily.precipitation_probability_max[index],
        windSpeedMax: weatherData.daily.wind_speed_10m_max[index],
        weatherCode: weatherData.daily.weather_code[index],
        weatherDescription: weatherCodes[weatherData.daily.weather_code[index]] || 'Unknown',
        sunrise: weatherData.daily.sunrise[index],
        sunset: weatherData.daily.sunset[index],
      })),
      alerts: generateAlerts(weatherData.daily),
    };
    
    console.log(`Weather fetched successfully. ${result.alerts.length} alerts generated.`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching weather:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch weather data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
