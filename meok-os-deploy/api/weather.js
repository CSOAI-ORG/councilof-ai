// Live weather — free, no key (Open-Meteo geocode + forecast). Proxied here so the browser
// gets guaranteed CORS + one shared backend across meok/csoai/defoneos.
const WMO = { 0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 56: 'freezing drizzle', 57: 'freezing drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain', 71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains', 80: 'rain showers', 81: 'showers', 82: 'violent showers', 85: 'snow showers', 86: 'snow showers', 95: 'thunderstorm', 96: 'thunderstorm w/ hail', 99: 'thunderstorm w/ hail' };
function emoji(c) { if (c === 0 || c === 1) return '☀️'; if (c === 2) return '⛅'; if (c === 3) return '☁️'; if (c >= 45 && c <= 48) return '🌫️'; if (c >= 51 && c <= 67) return '🌧️'; if (c >= 71 && c <= 77) return '❄️'; if (c >= 80 && c <= 82) return '🌦️'; if (c >= 85 && c <= 86) return '🌨️'; if (c >= 95) return '⛈️'; return '🌡️'; }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600');
  const q = ((req.query && (req.query.q || req.query.city)) || '').toString().slice(0, 80).trim();
  if (!q) return res.status(200).json({ error: 'pass ?q=<city>' });
  try {
    const g = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=' + encodeURIComponent(q))).json();
    const loc = g.results && g.results[0];
    if (!loc) return res.status(200).json({ error: 'city not found', q });
    const f = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)).json();
    const c = (f && f.current) || {};
    const d = (f && f.daily) || {};
    const hm = (s) => (typeof s === 'string' && s.length >= 16) ? s.slice(11, 16) : null;
    return res.status(200).json({ city: loc.name, country: loc.country, temp: c.temperature_2m, feels: c.apparent_temperature, code: c.weather_code, desc: WMO[c.weather_code] || '', wind: c.wind_speed_10m, humidity: c.relative_humidity_2m, emoji: emoji(c.weather_code), hi: d.temperature_2m_max && d.temperature_2m_max[0], lo: d.temperature_2m_min && d.temperature_2m_min[0], sunrise: hm(d.sunrise && d.sunrise[0]), sunset: hm(d.sunset && d.sunset[0]) });
  } catch (e) { return res.status(200).json({ error: String(e && e.message || e) }); }
}
