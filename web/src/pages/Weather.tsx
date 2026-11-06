import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  RefreshCw,
  MapPin,
  Gauge as GaugeIcon,
} from 'lucide-react';
import { Coordinates, WeatherData, WeatherForecastDay, WeatherForecastHour } from '@/lib/types';
import { WEATHER_CODES } from '@/lib/data/comms';
import { useGeolocation } from '@/lib/device';
import { saveWeatherCache, loadWeatherCache, CachedWeather } from '@/lib/weatherCache';
import { TCard, SectionTitle, Chip } from '@/components/tactical';
import { Button } from '@/components/ui/button';

function WeatherIcon({ code, size, isDay = true }: { code: number; size: number; isDay?: boolean }) {
  const cls = `shrink-0`;
  if (code === 0 || code === 1) return <Sun className={cls} style={{ width: size, height: size, color: '#F6C243' }} />;
  if (code === 2) return <CloudSun className={cls} style={{ width: size, height: size, color: '#E8A04A' }} />;
  if (code === 3) return <Cloud className={cls} style={{ width: size, height: size, color: '#9A9890' }} />;
  if (code === 45 || code === 48) return <CloudFog className={cls} style={{ width: size, height: size, color: '#9A9890' }} />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className={cls} style={{ width: size, height: size, color: '#64B5F6' }} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className={cls} style={{ width: size, height: size, color: '#42A5F5' }} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow className={cls} style={{ width: size, height: size, color: '#E0E0E0' }} />;
  if (code >= 95) return <CloudLightning className={cls} style={{ width: size, height: size, color: '#FFA726' }} />;
  return <Sun className={cls} style={{ width: size, height: size, color: '#F6C243' }} />;
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: 'numeric' }).replace(' ', '');
}

function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
}

async function fetchWeather(coords: Coordinates) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

export default function Weather() {
  const { coords, error: locationError, loading, locate } = useGeolocation();
  const [cached, setCached] = useState<CachedWeather | null>(null);

  useEffect(() => {
    if (!coords) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadWeatherCache().then(setCached);
  }, []);

  const weatherQuery = useQuery({
    queryKey: ['weather', coords?.latitude, coords?.longitude],
    queryFn: () => fetchWeather(coords!),
    enabled: !!coords,
    refetchInterval: 600000,
    staleTime: 300000,
  });

  // Cache on every successful fetch for offline use
  useEffect(() => {
    const data = weatherQuery.data;
    if (data?.current && coords) {
      void saveWeatherCache(
        {
          temperature: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          weatherCode: data.current.weather_code,
          precipitation: data.current.precipitation,
          pressure: data.current.surface_pressure,
          visibility: 0,
          uvIndex: 0,
          isDay: data.current.is_day === 1,
          updatedAt: new Date().toISOString(),
        },
        coords
      );
    }
  }, [weatherQuery.data, coords]);

  if (!coords || loading || weatherQuery.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Cloud className="w-12 h-12 text-[#6A6860] animate-pulse mb-4" />
        <div className="gd-label text-sm text-[#9A9890]">ACQUIRING WEATHER DATA</div>
        <div className="text-xs text-[#6A6860] mt-1">{!coords ? 'Getting location…' : 'Fetching conditions…'}</div>
      </div>
    );
  }

  if (weatherQuery.error && !cached) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CloudRain className="w-12 h-12 text-[#F44336] mb-4" />
        <div className="gd-label text-sm text-[#9A9890]">WEATHER UNAVAILABLE</div>
        <div className="text-xs text-[#6A6860] mt-1">Unable to fetch weather data</div>
        <Button onClick={() => weatherQuery.refetch()} className="mt-4 bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> RETRY
        </Button>
      </div>
    );
  }

  // Live or cached
  const usingCache = !!weatherQuery.error && !!cached;
  const currentWeather: WeatherData | null = weatherQuery.data?.current
    ? {
        temperature: weatherQuery.data.current.temperature_2m,
        feelsLike: weatherQuery.data.current.apparent_temperature,
        humidity: weatherQuery.data.current.relative_humidity_2m,
        windSpeed: weatherQuery.data.current.wind_speed_10m,
        windDirection: weatherQuery.data.current.wind_direction_10m,
        weatherCode: weatherQuery.data.current.weather_code,
        precipitation: weatherQuery.data.current.precipitation,
        pressure: weatherQuery.data.current.surface_pressure,
        visibility: 0,
        uvIndex: 0,
        isDay: weatherQuery.data.current.is_day === 1,
        updatedAt: new Date().toISOString(),
      }
    : cached?.data ?? null;

  const hourlyForecast: WeatherForecastHour[] = weatherQuery.data?.hourly
    ? Array.from({ length: 24 }, (_, i) => ({
        time: weatherQuery.data.hourly.time[i],
        temperature: weatherQuery.data.hourly.temperature_2m[i],
        weatherCode: weatherQuery.data.hourly.weather_code[i],
        precipitation: weatherQuery.data.hourly.precipitation[i],
        windSpeed: weatherQuery.data.hourly.wind_speed_10m[i],
      }))
    : [];

  const dailyForecast: WeatherForecastDay[] = weatherQuery.data?.daily
    ? weatherQuery.data.daily.time.map((d: string, i: number) => ({
        date: d,
        tempMax: weatherQuery.data.daily.temperature_2m_max[i],
        tempMin: weatherQuery.data.daily.temperature_2m_min[i],
        weatherCode: weatherQuery.data.daily.weather_code[i],
        precipSum: weatherQuery.data.daily.precipitation_sum[i],
        windMax: weatherQuery.data.daily.wind_speed_10m_max[i],
        sunrise: weatherQuery.data.daily.sunrise[i],
        sunset: weatherQuery.data.daily.sunset[i],
      }))
    : [];

  const weatherLabel = currentWeather ? WEATHER_CODES[currentWeather.weatherCode]?.label ?? 'Unknown' : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg gd-label text-[#E8E4DC]">WEATHER</h1>
        <button
          onClick={() => weatherQuery.refetch()}
          className="p-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[#9A9890] hover:text-[#E8A04A] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${weatherQuery.isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {(locationError || usingCache) && (
        <div className="flex items-center gap-2 mb-3 text-xs text-[#FFC107]">
          <MapPin className="w-3.5 h-3.5" />
          {locationError || `Showing cached conditions`}
        </div>
      )}

      {currentWeather && (
        <TCard className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <WeatherIcon code={currentWeather.weatherCode} size={56} isDay={currentWeather.isDay} />
            <div className="text-5xl font-bold text-[#E8E4DC] font-[Chakra_Petch]">
              {Math.round(currentWeather.temperature)}°
            </div>
            <div>
              <div className="gd-label text-sm text-[#E8E4DC]">{weatherLabel}</div>
              <div className="text-xs text-[#9A9890] mt-0.5">Feels like {Math.round(currentWeather.feelsLike)}°F</div>
              <div className="flex items-center gap-1 text-[10px] text-[#6A6860] mt-1">
                <MapPin className="w-2.5 h-2.5" />
                {coords.latitude.toFixed(2)}°, {coords.longitude.toFixed(2)}°
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <Metric icon={<Wind className="w-4 h-4 text-[#8B9A6A]" />} label="WIND" value={`${Math.round(currentWeather.windSpeed)} mph`} sub={windDirectionLabel(currentWeather.windDirection)} />
            <Metric icon={<Droplets className="w-4 h-4 text-[#64B5F6]" />} label="HUMIDITY" value={`${currentWeather.humidity}%`} />
            <Metric icon={<CloudRain className="w-4 h-4 text-[#42A5F5]" />} label="PRECIP" value={`${currentWeather.precipitation} in`} />
            <Metric icon={<Gauge className="w-4 h-4 text-[#E8A04A]" />} label="PRESSURE" value={`${Math.round(currentWeather.pressure)} hPa`} />
          </div>
        </TCard>
      )}

      <div className="flex items-center gap-2 text-[10px] text-[#6A6860] mb-2">
        <GaugeIcon className="w-3 h-3" />
        Barometer sensor not available in this browser — using forecast pressure above.
      </div>

      {hourlyForecast.length > 0 && (
        <>
          <SectionTitle>NEXT 24 HOURS</SectionTitle>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {hourlyForecast.map((h, i) => (
              <div key={i} className="shrink-0 w-16 bg-[#242824] border border-[#3A3F3A] rounded-lg p-2 flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-[#6A6860] gd-label">{formatTime(h.time)}</span>
                <WeatherIcon code={h.weatherCode} size={20} />
                <span className="text-xs font-bold text-[#E8E4DC]">{Math.round(h.temperature)}°</span>
                {h.precipitation > 0 && <span className="text-[8px] text-[#42A5F5]">{h.precipitation.toFixed(2)}″</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {dailyForecast.length > 0 && (
        <>
          <SectionTitle>7-DAY OUTLOOK</SectionTitle>
          <TCard className="px-3">
            {dailyForecast.map((d, i) => (
              <div key={d.date} className={`flex items-center gap-3 py-2.5 ${i < dailyForecast.length - 1 ? 'border-b border-[#3A3F3A]' : ''}`}>
                <span className="text-[11px] gd-label text-[#9A9890] w-9">{formatDayShort(d.date)}</span>
                <WeatherIcon code={d.weatherCode} size={18} />
                <div className="flex-1 flex items-center gap-2 text-xs">
                  <span className="text-[#9A9890]">{Math.round(d.tempMin)}°</span>
                  <div className="flex-1 h-1 bg-[#333833] rounded-full relative overflow-hidden">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-[#42A5F5] to-[#E8A04A]"
                      style={{
                        left: `${Math.max(0, Math.min(100, ((d.tempMin - 20) / 80) * 100))}%`,
                        right: `${Math.max(0, Math.min(100, 100 - ((d.tempMax - 20) / 80) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[#E8E4DC] font-bold">{Math.round(d.tempMax)}°</span>
                </div>
                <span className="text-[10px] text-[#42A5F5] w-14 text-right">{d.precipSum > 0 ? `${d.precipSum.toFixed(2)}″` : '—'}</span>
              </div>
            ))}
          </TCard>
        </>
      )}

      {dailyForecast[0] && (
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-[#242824] border border-[#3A3F3A] rounded-xl p-3 flex items-center gap-2 text-xs text-[#E8E4DC]">
            <Sunrise className="w-4 h-4 text-[#E8A04A]" />
            <span>{new Date(dailyForecast[0].sunrise).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
          <div className="flex-1 bg-[#242824] border border-[#3A3F3A] rounded-xl p-3 flex items-center gap-2 text-xs text-[#E8E4DC]">
            <Sunset className="w-4 h-4 text-[#D4822A]" />
            <span>{new Date(dailyForecast[0].sunset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
      )}

      <div className="mt-6 text-[10px] text-[#6A6860] text-center">
        Forecast by Open-Meteo (CC BY 4.0) · Cached for offline use
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1E221E] border border-[#3A3F3A] rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[8px] gd-label text-[#6A6860]">{label}</span>
      </div>
      <div className="text-sm font-bold text-[#E8E4DC]">{value}</div>
      {sub && <div className="text-[10px] text-[#6A6860]">{sub}</div>}
    </div>
  );
}
