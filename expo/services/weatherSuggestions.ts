import { WeatherData } from '@/types';
import { POI } from '@/types';

/**
 * Weather-triggered tactical resource suggestions.
 *
 * When weather conditions change (rain, snow, storms, extreme heat, etc.),
 * this engine calls the Rork AI proxy to generate context-aware POI
 * suggestions near the user's location — potable water opportunities,
 * shelter needs, hazard zones, and other dynamic resources.
 */

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL;
const SECRET_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;
const MODEL_ID = 'google/gemini-2.5-flash-lite';

export interface WeatherSuggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  latOffset: number;
  lngOffset: number;
  reasoning: string;
}

export interface WeatherSuggestionResponse {
  suggestions: WeatherSuggestion[];
  summary: string;
}

/**
 * Determine if current weather conditions warrant resource suggestions.
 * Returns a human-readable trigger description, or null if conditions are benign.
 */
export function getWeatherTrigger(weather: WeatherData): string | null {
  const code = weather.weatherCode;
  const precip = weather.precipitation;
  const wind = weather.windSpeed;
  const temp = weather.temperature;
  const humidity = weather.humidity;

  // Heavy rain (61-67, 80-82) — water collection opportunity
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    if (precip >= 0.1) {
      return `Heavy precipitation (${precip.toFixed(2)}in) — potable water collection opportunities available. Rainwater can be harvested at elevated collection points.`;
    }
  }

  // Thunderstorm (95-99) — shelter and hazard
  if (code >= 95) {
    return `Thunderstorm activity — seek shelter, avoid high ground and open areas. Metal structures and tall objects are lightning hazards.`;
  }

  // Snow (71-77, 85-86) — shelter and warmth
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return `Snow conditions — shelter and warmth are critical. Avoid exposed routes. Whiteout risk on elevated terrain.`;
  }

  // Fog (45, 48) — navigation hazard
  if (code === 45 || code === 48) {
    return `Fog conditions — reduced visibility. Navigation hazards on roads and elevated positions. Stay near known landmarks.`;
  }

  // High wind — structural and movement hazard
  if (wind >= 25) {
    return `High winds (${wind.toFixed(0)} mph) — structural damage risk. Avoid tree-lined routes and loose structures. Secure outdoor equipment.`;
  }

  // Extreme heat
  if (temp >= 100) {
    return `Extreme heat (${Math.round(temp)}°F) — water consumption will increase 2-3x. Prioritize shade and water sources. Heat exhaustion risk.`;
  }

  // Extreme cold
  if (temp <= 20) {
    return `Extreme cold (${Math.round(temp)}°F) — hypothermia risk. Shelter and fire-starting materials are priority. Avoid wind-exposed positions.`;
  }

  // High humidity + moderate temp — dew collection possible
  if (humidity >= 85 && temp > 40 && temp < 80) {
    return `High humidity (${humidity}%) — dew collection possible at dawn on metal and plastic surfaces. Passive water harvesting opportunity.`;
  }

  return null;
}

/**
 * Call the Rork AI proxy to generate weather-triggered tactical resource
 * suggestions based on current conditions and user location.
 */
export async function fetchWeatherSuggestions(
  weather: WeatherData,
  userLocation: { latitude: number; longitude: number }
): Promise<WeatherSuggestionResponse> {
  const trigger = getWeatherTrigger(weather);

  if (!trigger) {
    return { suggestions: [], summary: 'Current conditions are stable — no weather-triggered resource alerts.' };
  }

  if (!TOOLKIT_URL || !SECRET_KEY) {
    // Graceful fallback: generate rule-based suggestions without AI
    return generateLocalSuggestions(weather, trigger, userLocation);
  }

  const prompt = `You are a tactical preparedness AI for a grid-down emergency app called GRIDDOWN.

Current weather conditions near ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}:
- Temperature: ${Math.round(weather.temperature)}°F (feels like ${Math.round(weather.feelsLike)}°F)
- Weather code: ${weather.weatherCode}
- Precipitation: ${weather.precipitation.toFixed(2)} inches
- Wind: ${weather.windSpeed.toFixed(0)} mph from ${weather.windDirection}°
- Humidity: ${weather.humidity}%
- Pressure: ${weather.pressure.toFixed(0)} hPa
- UV Index: ${weather.uvIndex}
- Visibility: ${weather.visibility.toFixed(1)} miles

Trigger: ${trigger}

Generate 1-4 tactical POI (point of interest) suggestions that the group should mark on their map given these conditions. Think about:
- Where to collect potable water (rainwater collection, runoff, natural sources)
- Where to seek shelter (covered areas, wind-protected zones)
- Hazards to avoid (flood zones, lightning-prone high ground, wind-exposed structures)
- Resource opportunities (dew collection surfaces, natural windbreaks)

For each suggestion, provide:
- title: Short name (e.g. "Rainwater Collection Point", "Wind-Protected Shelter")
- category: One of: water, shelter, hazard, weather_resource, rally_point, supply_cache
- description: 1-2 sentences explaining the resource and how to use it
- latOffset: Small latitude offset from user location (0.001-0.02 degrees, can be negative)
- lngOffset: Small longitude offset from user location (0.001-0.02 degrees, can be negative)
- reasoning: Why this suggestion is relevant to the current weather

Respond as JSON: {"suggestions": [...], "summary": "one-line overview"}`;

  try {
    const response = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: 'You are a tactical AI assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.log('Weather suggestion API error:', response.status);
      return generateLocalSuggestions(weather, trigger, userLocation);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return generateLocalSuggestions(weather, trigger, userLocation);
    }

    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateLocalSuggestions(weather, trigger, userLocation);
    }

    const parsed = JSON.parse(jsonMatch[0]) as WeatherSuggestionResponse;

    // Assign IDs to suggestions
    parsed.suggestions = (parsed.suggestions || []).map((s, i) => ({
      ...s,
      id: `weather-sugg-${Date.now()}-${i}`,
    }));

    return parsed;
  } catch (error) {
    console.log('Weather suggestion fetch error:', error);
    return generateLocalSuggestions(weather, trigger, userLocation);
  }
}

/**
 * Local rule-based fallback when AI proxy is unavailable.
 * Generates practical suggestions from weather conditions without an API call.
 */
function generateLocalSuggestions(
  weather: WeatherData,
  trigger: string,
  userLocation: { latitude: number; longitude: number }
): WeatherSuggestionResponse {
  const suggestions: WeatherSuggestion[] = [];
  const code = weather.weatherCode;
  let idCounter = 0;

  const makeId = () => `weather-local-${Date.now()}-${idCounter++}`;

  // Rain → water collection
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    suggestions.push({
      id: makeId(),
      title: 'Rainwater Collection Point',
      category: 'water',
      description: 'Deploy tarps and collection barrels at this elevated position. Wait 10 min after rain starts to avoid debris. Filter and purify before drinking.',
      latOffset: 0.005,
      lngOffset: 0.003,
      reasoning: `Active precipitation (${weather.precipitation.toFixed(2)}in) makes rainwater harvesting viable at scale.`,
    });

    suggestions.push({
      id: makeId(),
      title: 'Runoff Collection — Low Ground',
      category: 'water',
      description: 'Natural runoff channel. Place containers at confluence point. High volume but higher contamination risk — double-filter required.',
      latOffset: -0.008,
      lngOffset: -0.004,
      reasoning: 'Rainfall creates surface runoff that converges at low-elevation points.',
    });
  }

  // Thunderstorm → shelter + hazard
  if (code >= 95) {
    suggestions.push({
      id: makeId(),
      title: 'Lightning Shelter — Low Ground',
      category: 'shelter',
      description: 'Seek shelter in a substantial building or hard-topped vehicle. Avoid open areas, tall isolated trees, and metal structures.',
      latOffset: -0.003,
      lngOffset: 0.006,
      reasoning: 'Thunderstorm activity makes high ground and open areas extremely dangerous.',
    });

    suggestions.push({
      id: makeId(),
      title: 'Lightning Hazard Zone — High Ground',
      category: 'hazard',
      description: 'Avoid this elevated area during thunderstorm. Lightning strikes preferentially target high points.',
      latOffset: 0.010,
      lngOffset: 0.008,
      reasoning: 'Elevated terrain is a primary lightning strike target during electrical storms.',
    });
  }

  // Snow → shelter
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    suggestions.push({
      id: makeId(),
      title: 'Wind-Protected Shelter',
      category: 'shelter',
      description: 'Natural windbreak — leeward side of terrain feature. Build snow shelter if no structure available. Insulate from ground.',
      latOffset: 0.004,
      lngOffset: -0.005,
      reasoning: 'Snow conditions require shelter that blocks wind and retains body heat.',
    });
  }

  // High wind → hazard
  if (weather.windSpeed >= 25) {
    suggestions.push({
      id: makeId(),
      title: 'Wind Hazard — Exposed Corridor',
      category: 'hazard',
      description: 'Avoid this open corridor during high winds. Flying debris and structural failure risk. Seek protected routes instead.',
      latOffset: 0.002,
      lngOffset: -0.007,
      reasoning: `Sustained winds at ${weather.windSpeed.toFixed(0)} mph create debris and structural hazards in open areas.`,
    });
  }

  // Extreme heat → water priority
  if (weather.temperature >= 100) {
    suggestions.push({
      id: makeId(),
      title: 'Shade & Water Staging Point',
      category: 'shelter',
      description: 'Natural shade structure. Set up hydration station here. Water consumption will be 2-3x normal. Monitor for heat exhaustion.',
      latOffset: -0.004,
      lngOffset: 0.005,
      reasoning: `Extreme heat (${Math.round(weather.temperature)}°F) dramatically increases water needs and heat illness risk.`,
    });
  }

  // Extreme cold → warmth
  if (weather.temperature <= 20) {
    suggestions.push({
      id: makeId(),
      title: 'Emergency Warming Shelter',
      category: 'shelter',
      description: 'Identify insulated structure. Block drafts, concentrate body heat, maintain fire if safe. Watch for frostbite on exposed skin.',
      latOffset: 0.006,
      lngOffset: 0.002,
      reasoning: `Extreme cold (${Math.round(weather.temperature)}°F) — hypothermia risk within 2-3 hours without adequate shelter.`,
    });
  }

  // High humidity → dew collection
  if (weather.humidity >= 85 && weather.temperature > 40 && weather.temperature < 80) {
    suggestions.push({
      id: makeId(),
      title: 'Dew Collection Surface',
      category: 'water',
      description: 'Metal or plastic sheeting placed here will collect condensation at dawn. Wipe into container with clean cloth. 1-2 cups per night possible.',
      latOffset: 0.003,
      lngOffset: -0.003,
      reasoning: `High humidity (${weather.humidity}%) creates ideal conditions for passive dew condensation overnight.`,
    });
  }

  // Fog → navigation hazard
  if (code === 45 || code === 48) {
    suggestions.push({
      id: makeId(),
      title: 'Navigation Hazard — Reduced Visibility',
      category: 'hazard',
      description: 'Visibility severely reduced. Mark known landmarks with reflective markers. Use compass and dead reckoning. Avoid vehicle movement.',
      latOffset: 0.001,
      lngOffset: 0.001,
      reasoning: 'Fog conditions make visual navigation unreliable and increase collision risk.',
    });
  }

  return {
    suggestions,
    summary: trigger,
  };
}

/**
 * Convert a WeatherSuggestion into a POI that can be added to the map.
 */
export function suggestionToPoi(
  suggestion: WeatherSuggestion,
  userLocation: { latitude: number; longitude: number }
): POI {
  const category = (['water', 'shelter', 'hazard', 'weather_resource', 'rally_point', 'supply_cache'].includes(suggestion.category)
    ? suggestion.category
    : 'weather_resource') as POI['category'];

  return {
    id: suggestion.id,
    name: suggestion.title,
    category,
    coordinates: {
      latitude: userLocation.latitude + suggestion.latOffset,
      longitude: userLocation.longitude + suggestion.lngOffset,
    },
    notes: `${suggestion.description}\n\nReason: ${suggestion.reasoning}`,
    createdAt: new Date().toISOString(),
  };
}
