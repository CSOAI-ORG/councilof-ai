import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudRain, Sun, Wind, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  alerts: string[];
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-weather-forecast', {
          body: { location: 'London,UK' }
        });

        if (error) throw error;
        
        if (data?.forecast) {
          const current = data.forecast[0];
          setWeather({
            temperature: current?.temp || 12,
            condition: current?.condition || 'Partly Cloudy',
            windSpeed: current?.wind || 15,
            alerts: current?.alerts || []
          });
        } else {
          // Fallback data if API unavailable
          setWeather({
            temperature: 12,
            condition: 'Partly Cloudy',
            windSpeed: 15,
            alerts: []
          });
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        // Fallback for demo
        setWeather({
          temperature: 12,
          condition: 'Partly Cloudy',
          windSpeed: 15,
          alerts: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    }
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    }
    if (lowerCondition.includes('wind')) {
      return <Wind className="h-8 w-8 text-muted-foreground" />;
    }
    return <Cloud className="h-8 w-8 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-5 w-5 text-blue-500" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-5 w-5 text-blue-500" />
          Weather Conditions
        </CardTitle>
        <CardDescription className="text-sm">
          Operations impact
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {weather && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {getWeatherIcon(weather.condition)}
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{weather.temperature}°C</div>
                <div className="text-sm text-muted-foreground">{weather.condition}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="h-4 w-4" />
              <span>{weather.windSpeed} km/h</span>
            </div>

            {weather.alerts.length > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {weather.alerts.length} Alert{weather.alerts.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/weather">Full Forecast</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
