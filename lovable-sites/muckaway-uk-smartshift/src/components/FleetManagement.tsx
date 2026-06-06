import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Users, Plus, Search, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehicleCard } from "./VehicleCard";
import { DriverCard } from "./DriverCard";
import { AddVehicleDialog } from "./AddVehicleDialog";
import { AddDriverDialog } from "./AddDriverDialog";
import { DashboardLayout } from "@/components/DashboardLayout";

export const FleetManagement = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [jobAssignments, setJobAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .order("registration");

      if (vehiclesError) throw vehiclesError;

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("name");

      if (driversError) throw driversError;

      // Load job assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("job_assignments")
        .select(`
          *,
          jobs(id, status, spoil_type, scheduled_date),
          vehicles(registration, vehicle_type),
          drivers(name)
        `)
        .order("assigned_date", { ascending: false })
        .limit(20);

      if (assignmentsError) throw assignmentsError;

      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
      setJobAssignments(assignmentsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load fleet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setAddVehicleOpen(true);
  };

  const handleEditDriver = (driver: any) => {
    setEditingDriver(driver);
    setAddDriverOpen(true);
  };

  const handleViewTracking = (vehicleId: string) => {
    toast({
      title: "Vehicle Tracking",
      description: "Real-time tracking feature coming soon!",
    });
  };

  const handleViewChecks = (driverId: string) => {
    window.location.href = `/driver-checks?driver=${driverId}`;
  };

  const getFleetStats = () => {
    const activeVehicles = vehicles.filter(v => v.active).length;
    const activeDrivers = drivers.filter(d => d.active).length;
    const vehiclesNeedingAttention = vehicles.filter(v => {
      const motExpiringSoon = v.mot_expiry && new Date(v.mot_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const serviceDue = v.next_service_due && new Date(v.next_service_due) <= new Date();
      return motExpiringSoon || serviceDue;
    }).length;
    const driversNeedingAttention = drivers.filter(d => {
      const licenceExpiringSoon = d.licence_expiry && new Date(d.licence_expiry) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      return licenceExpiringSoon;
    }).length;

    return {
      activeVehicles,
      activeDrivers,
      vehiclesNeedingAttention,
      driversNeedingAttention
    };
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licence_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getFleetStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading fleet data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Fleet Management</h1>
              <p className="text-muted-foreground">Manage your vehicles, drivers, and job assignments</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setAddVehicleOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
              <Button onClick={() => setAddDriverOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Driver
              </Button>
            </div>
          </div>

          {/* Fleet Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                <Truck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.activeVehicles}</div>
                <p className="text-xs text-muted-foreground">of {vehicles.length} total</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.activeDrivers}</div>
                <p className="text-xs text-muted-foreground">of {drivers.length} total</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicles Need Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.vehiclesNeedingAttention}</div>
                <p className="text-xs text-muted-foreground">MOT/Service due</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drivers Need Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.driversNeedingAttention}</div>
                <p className="text-xs text-muted-foreground">Licence expiring</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="assignments">Job Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={handleEditVehicle}
                  onViewTracking={handleViewTracking}
                />
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No vehicles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Add your first vehicle to get started"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setAddVehicleOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onEdit={handleEditDriver}
                  onViewChecks={handleViewChecks}
                />
              ))}
            </div>

            {filteredDrivers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No drivers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Add your first driver to get started"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setAddDriverOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Recent Job Assignments</CardTitle>
                <CardDescription>Latest vehicle and driver assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {jobAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No job assignments</h3>
                    <p className="text-muted-foreground">Job assignments will appear here when jobs are booked</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-primary/10 text-primary">
                              {assignment.jobs?.status || 'Unknown'}
                            </Badge>
                            <span className="font-medium">{assignment.vehicles?.registration}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{assignment.drivers?.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.jobs?.spoil_type} • Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                            {assignment.jobs?.scheduled_date && (
                              <span> • Scheduled: {new Date(assignment.jobs.scheduled_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddVehicleDialog
        open={addVehicleOpen}
        onOpenChange={(open) => {
          setAddVehicleOpen(open);
          if (!open) setEditingVehicle(null);
        }}
        onSuccess={loadFleetData}
        vehicle={editingVehicle}
      />

      <AddDriverDialog
        open={addDriverOpen}
        onOpenChange={(open) => {
          setAddDriverOpen(open);
          if (!open) setEditingDriver(null);
        }}
        onSuccess={loadFleetData}
        driver={editingDriver}
      />
      </div>
    </DashboardLayout>
  );
};