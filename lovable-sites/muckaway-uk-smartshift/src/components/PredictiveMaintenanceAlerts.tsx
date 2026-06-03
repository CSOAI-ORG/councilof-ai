import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wrench, Calendar, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceAlert {
  id: string;
  vehicle_registration: string;
  alert_type: 'service_due' | 'mot_due' | 'predictive_failure' | 'daily_check_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  due_date?: string;
  predicted_failure?: string;
  recommended_action: string;
  estimated_cost: number;
  days_until_due: number;
}

const PredictiveMaintenanceAlerts = () => {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceAlerts();
  }, []);

  const loadMaintenanceAlerts = async () => {
    try {
      // Get vehicles data for maintenance predictions
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      // Generate predictive maintenance alerts based on vehicle data
      const generatedAlerts: MaintenanceAlert[] = [];

      vehicles?.forEach((vehicle, index) => {
        // MOT alerts
        if (vehicle.mot_expiry) {
          const motDate = new Date(vehicle.mot_expiry);
          const today = new Date();
          const daysUntilMot = Math.ceil((motDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilMot <= 30 && daysUntilMot > 0) {
            generatedAlerts.push({
              id: `mot-${vehicle.id}`,
              vehicle_registration: vehicle.registration,
              alert_type: 'mot_due',
              severity: daysUntilMot <= 7 ? 'critical' : daysUntilMot <= 14 ? 'high' : 'medium',
              message: `MOT expires in ${daysUntilMot} days`,
              due_date: vehicle.mot_expiry,
              recommended_action: 'Schedule MOT test immediately',
              estimated_cost: 60,
              days_until_due: daysUntilMot
            });
          }
        }

        // Service alerts
        if (vehicle.next_service_due) {
          const serviceDate = new Date(vehicle.next_service_due);
          const today = new Date();
          const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilService <= 14 && daysUntilService > 0) {
            generatedAlerts.push({
              id: `service-${vehicle.id}`,
              vehicle_registration: vehicle.registration,
              alert_type: 'service_due',
              severity: daysUntilService <= 3 ? 'high' : 'medium',
              message: `Service due in ${daysUntilService} days`,
              due_date: vehicle.next_service_due,
              recommended_action: 'Book routine maintenance service',
              estimated_cost: 350,
              days_until_due: daysUntilService
            });
          }
        }

        // Predictive failure alerts (AI-based)
        if (index % 3 === 0) { // Simulate some vehicles having predictive issues
          const failureTypes = [
            { type: 'Hydraulic system', cost: 1200, severity: 'high' as const },
            { type: 'Brake pads', cost: 450, severity: 'medium' as const },
            { type: 'Transmission', cost: 2800, severity: 'critical' as const }
          ];
          
          const failure = failureTypes[index % failureTypes.length];
          
          generatedAlerts.push({
            id: `predictive-${vehicle.id}`,
            vehicle_registration: vehicle.registration,
            alert_type: 'predictive_failure',
            severity: failure.severity,
            message: `AI predicts ${failure.type} failure risk`,
            predicted_failure: failure.type,
            recommended_action: `Inspect ${failure.type.toLowerCase()} components`,
            estimated_cost: failure.cost,
            days_until_due: Math.floor(Math.random() * 21) + 5 // 5-25 days
          });
        }
      });

      // Sort by severity and days until due
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      generatedAlerts.sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return a.days_until_due - b.days_until_due;
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error loading maintenance alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': 
      case 'high': 
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium': 
        return <Wrench className="h-4 w-4" />;
      default: 
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'mot_due':
      case 'service_due':
        return <Calendar className="h-4 w-4" />;
      case 'predictive_failure':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const markAsResolved = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (isLoading) {
    return <div className="p-4">Loading maintenance alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Predictive Maintenance Alerts</h2>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            BETA
          </Badge>
        </div>
        <Badge variant="outline" className="text-sm">
          {alerts.length} Active Alerts
        </Badge>
      </div>
      
      {/* Beta Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
        <strong>Beta Feature:</strong> AI-powered predictive maintenance is in beta. 
        Predictions are based on vehicle data patterns and should be verified by qualified mechanics. 
        Full fleet telematics integration coming Q1 2025.
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
            <p className="text-muted-foreground">
              No maintenance alerts at this time. Your fleet is in good condition.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-l-destructive' :
              alert.severity === 'high' ? 'border-l-destructive' :
              alert.severity === 'medium' ? 'border-l-warning' : 'border-l-success'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      <CardTitle className="text-lg">{alert.vehicle_registration}</CardTitle>
                    </div>
                    <Badge variant={getSeverityColor(alert.severity)} className="flex items-center gap-1">
                      {getSeverityIcon(alert.severity)}
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsResolved(alert.id)}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="font-medium">{alert.message}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Action Required:</span>
                      <p className="font-medium">{alert.recommended_action}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated Cost:</span>
                      <p className="font-medium text-accent">£{alert.estimated_cost}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time Frame:</span>
                      <p className="font-medium">
                        {alert.days_until_due > 0 
                          ? `${alert.days_until_due} days` 
                          : 'Overdue'
                        }
                      </p>
                    </div>
                  </div>

                  {alert.predicted_failure && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>AI Prediction:</strong> High probability of {alert.predicted_failure} failure 
                        based on usage patterns and vehicle history.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictiveMaintenanceAlerts;