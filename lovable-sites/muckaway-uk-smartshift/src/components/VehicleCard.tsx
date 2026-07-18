import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface Vehicle {
  id: string;
  registration: string;
  vehicle_type: string;
  capacity_tonnes: number;
  active: boolean;
  mot_expiry: string;
  last_service: string;
  next_service_due: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onViewTracking: (vehicleId: string) => void;
}

export const VehicleCard = ({ vehicle, onEdit, onViewTracking }: VehicleCardProps) => {
  const isMotExpiringSoon = vehicle.mot_expiry && new Date(vehicle.mot_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isServiceDue = vehicle.next_service_due && new Date(vehicle.next_service_due) <= new Date();

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{vehicle.registration}</CardTitle>
              <CardDescription>{vehicle.vehicle_type}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={vehicle.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {vehicle.active ? "Active" : "Inactive"}
            </Badge>
            {(isMotExpiringSoon || isServiceDue) && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Capacity:</span>
            <div className="font-semibold">{vehicle.capacity_tonnes}t</div>
          </div>
          <div>
            <span className="text-muted-foreground">MOT Expiry:</span>
            <div className={`font-semibold ${isMotExpiringSoon ? 'text-yellow-600' : ''}`}>
              {vehicle.mot_expiry ? new Date(vehicle.mot_expiry).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Last Service:</span>
            <div className="font-semibold">
              {vehicle.last_service ? new Date(vehicle.last_service).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Next Service:</span>
            <div className={`font-semibold ${isServiceDue ? 'text-red-600' : ''}`}>
              {vehicle.next_service_due ? new Date(vehicle.next_service_due).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {(isMotExpiringSoon || isServiceDue) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Attention Required</span>
            </div>
            <ul className="text-sm text-yellow-700 mt-1 ml-6">
              {isMotExpiringSoon && <li>MOT expires within 30 days</li>}
              {isServiceDue && <li>Service overdue</li>}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(vehicle)} className="flex-1">
            Edit Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewTracking(vehicle.id)} className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Track Vehicle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};