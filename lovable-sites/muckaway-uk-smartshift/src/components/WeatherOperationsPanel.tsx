import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Sun,
  CloudFog,
  Zap,
  MapPin,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

interface Job {
  id: string;
  site_address: string;
  site_postcode: string;
  scheduled_date: string;
  material_type: string;
  volume_tonnes: number;
}

const getWeatherIcon = (code: number, isDay: boolean = true) => {
  if ([0, 1].includes(code)) return isDay ? Sun : Cloud;
  if ([2, 3].includes(code)) return CloudSun;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return Zap;
  return Cloud;
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
};

export default function WeatherOperationsPanel() {
  const { toast } = useToast();
  const [postcode, setPostcode] = useState('SW1A 1AA');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [affectedJobs, setAffectedJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const fetchWeather = async (postcodeToFetch: string) => {
    if (!postcodeToFetch) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather-forecast', {
        body: { postcode: postcodeToFetch },
      });

      if (error) throw error;
      setWeather(data);
      
      // Check for affected jobs
      if (data.alerts && data.alerts.length > 0) {
        fetchAffectedJobs(data.alerts);
      } else {
        setAffectedJobs([]);
      }
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      toast({
        title: 'Failed to fetch weather',
        description: error.message || 'Could not retrieve weather data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAffectedJobs = async (alerts: WeatherData['alerts']) => {
    setJobsLoading(true);
    try {
      const affectedDates = [...new Set(alerts.flatMap(a => a.affectedDays))];
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, site_address, site_postcode, scheduled_date, material_type, volume_tonnes')
        .in('scheduled_date', affectedDates)
        .eq('status', 'scheduled')
        .limit(10);

      if (error) throw error;
      setAffectedJobs(jobs || []);
    } catch (error) {
      console.error('Error fetching affected jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(postcode);
  }, []);

  const handleSearch = () => {
    fetchWeather(postcode);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudSun className="h-5 w-5" />
            Weather Operations
          </CardTitle>
          <CardDescription>
            Check weather conditions for job sites and plan operations accordingly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter UK postcode (e.g., SW1A 1AA)"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Check Weather'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && !weather && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {weather && (
        <>
          {/* Current Conditions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-3xl font-bold">{weather.current.temperature.toFixed(1)}°C</p>
                    <p className="text-xs text-muted-foreground">
                      Feels like {weather.current.apparentTemperature.toFixed(1)}°C
                    </p>
                  </div>
                  <Thermometer className="h-10 w-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conditions</p>
                    <p className="text-xl font-semibold">{weather.current.weatherDescription}</p>
                    <p className="text-xs text-muted-foreground">
                      {weather.current.precipitation > 0 ? `${weather.current.precipitation}mm rain` : 'No precipitation'}
                    </p>
                  </div>
                  {(() => {
                    const Icon = getWeatherIcon(weather.current.weatherCode, weather.current.isDay);
                    return <Icon className="h-10 w-10 text-primary opacity-50" />;
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Wind</p>
                    <p className="text-3xl font-bold">{weather.current.windSpeed.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                  <Wind className="h-10 w-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="text-3xl font-bold">{weather.current.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Relative humidity</p>
                  </div>
                  <Droplets className="h-10 w-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Alerts */}
          {weather.alerts.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Weather Alerts ({weather.alerts.length})
                </CardTitle>
                <CardDescription>
                  Conditions that may affect operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weather.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant={getSeverityColor(alert.severity) as any} className="capitalize">
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          Affected: {alert.affectedDays.map(d => format(parseISO(d), 'EEE dd MMM')).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Jobs */}
          {affectedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Potentially Affected Jobs
                </CardTitle>
                <CardDescription>
                  Jobs scheduled during adverse weather conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-2">
                    {affectedJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{job.site_address}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.material_type} • {job.volume_tonnes}t • {format(parseISO(job.scheduled_date), 'EEE dd MMM')}
                          </p>
                        </div>
                        <Badge variant="outline">{job.site_postcode}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 7-Day Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
              <CardDescription>
                Plan your operations for the week ahead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weather.daily.map((day, index) => {
                  const Icon = getWeatherIcon(day.weatherCode, true);
                  const isToday = index === 0;
                  
                  return (
                    <div 
                      key={day.date} 
                      className={`p-4 rounded-lg text-center ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}
                    >
                      <p className="text-sm font-medium">
                        {isToday ? 'Today' : format(parseISO(day.date), 'EEE')}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {format(parseISO(day.date), 'dd MMM')}
                      </p>
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-xs text-muted-foreground mb-1">{day.weatherDescription}</p>
                      <div className="flex justify-center gap-1 text-sm">
                        <span className="font-semibold">{day.temperatureMax.toFixed(0)}°</span>
                        <span className="text-muted-foreground">{day.temperatureMin.toFixed(0)}°</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <Droplets className="h-3 w-3" />
                          {day.precipitationProbability}%
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Wind className="h-3 w-3" />
                          {day.windSpeedMax.toFixed(0)} km/h
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
