import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, AlertTriangle } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  licence_number: string;
  licence_expiry: string;
  phone: string;
  active: boolean;
}

interface DriverCardProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onViewChecks: (driverId: string) => void;
}

export const DriverCard = ({ driver, onEdit, onViewChecks }: DriverCardProps) => {
  const isLicenceExpiringSoon = driver.licence_expiry && new Date(driver.licence_expiry) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{driver.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {driver.phone || 'No phone number'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={driver.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {driver.active ? "Active" : "Inactive"}
            </Badge>
            {isLicenceExpiringSoon && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Licence Number:</span>
            <div className="font-semibold">{driver.licence_number}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Licence Expiry:</span>
            <div className={`font-semibold ${isLicenceExpiringSoon ? 'text-yellow-600' : ''}`}>
              {driver.licence_expiry ? new Date(driver.licence_expiry).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {isLicenceExpiringSoon && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Licence expires within 60 days</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(driver)} className="flex-1">
            Edit Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewChecks(driver.id)} className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Daily Checks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};