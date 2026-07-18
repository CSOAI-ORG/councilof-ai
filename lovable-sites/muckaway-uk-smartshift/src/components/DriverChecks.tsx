import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Truck, Calendar, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";

interface DailyCheck {
  id: string;
  driver_id: string;
  vehicle_id: string;
  check_date: string;
  lights_working: boolean;
  tyres_condition: boolean;
  brakes_working: boolean;
  mirrors_clean: boolean;
  seatbelt_working: boolean;
  horn_working: boolean;
  steering_responsive: boolean;
  fluid_levels_ok: boolean;
  load_securing_equipment: boolean;
  tailgate_operation: boolean;
  hydraulics_working: boolean;
  grab_arm_operation: boolean;
  defects_noted: string;
  vehicle_clean: boolean;
  odometer_reading: number;
  fuel_level: number;
  driver_signature: string;
  driver_name?: string;
  vehicle_registration?: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  registration: string;
  vehicle_type: string;
}

export const DriverChecks = () => {
  const [checks, setChecks] = useState<DailyCheck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [newCheck, setNewCheck] = useState({
    driver_id: "",
    vehicle_id: "",
    check_date: new Date().toISOString().split('T')[0],
    lights_working: false,
    tyres_condition: false,
    brakes_working: false,
    mirrors_clean: false,
    seatbelt_working: false,
    horn_working: false,
    steering_responsive: false,
    fluid_levels_ok: false,
    load_securing_equipment: false,
    tailgate_operation: false,
    hydraulics_working: false,
    grab_arm_operation: false,
    defects_noted: "",
    vehicle_clean: false,
    odometer_reading: "",
    fuel_level: ""
  });

  const checkItems = [
    { key: 'lights_working', label: 'Lights Working' },
    { key: 'tyres_condition', label: 'Tyres Condition' },
    { key: 'brakes_working', label: 'Brakes Working' },
    { key: 'mirrors_clean', label: 'Mirrors Clean' },
    { key: 'seatbelt_working', label: 'Seatbelt Working' },
    { key: 'horn_working', label: 'Horn Working' },
    { key: 'steering_responsive', label: 'Steering Responsive' },
    { key: 'fluid_levels_ok', label: 'Fluid Levels OK' },
    { key: 'load_securing_equipment', label: 'Load Securing Equipment' },
    { key: 'tailgate_operation', label: 'Tailgate Operation' },
    { key: 'hydraulics_working', label: 'Hydraulics Working' },
    { key: 'grab_arm_operation', label: 'Grab Arm Operation' },
    { key: 'vehicle_clean', label: 'Vehicle Clean' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load daily checks
      const { data: checksData, error: checksError } = await supabase
        .from("driver_daily_checks")
        .select(`
          *,
          drivers(name),
          vehicles(registration, vehicle_type)
        `)
        .order("check_date", { ascending: false });

      if (checksError) {
        console.error("Error loading checks:", checksError);
      } else {
        const formattedChecks = checksData?.map(check => ({
          ...check,
          driver_name: check.drivers?.name,
          vehicle_registration: check.vehicles?.registration
        })) || [];
        setChecks(formattedChecks);
      }

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name")
        .eq("active", true);

      if (driversError) {
        console.error("Error loading drivers:", driversError);
      } else {
        setDrivers(driversData || []);
      }

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, registration, vehicle_type")
        .eq("active", true);

      if (vehiclesError) {
        console.error("Error loading vehicles:", vehiclesError);
      } else {
        setVehicles(vehiclesData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDailyCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("driver_daily_checks")
        .insert({
          ...newCheck,
          odometer_reading: parseFloat(newCheck.odometer_reading) || null,
          fuel_level: parseFloat(newCheck.fuel_level) || null,
          driver_signature: "Digital Signature" // In real app, this would be actual signature
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create daily check",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Daily check completed successfully",
      });

      // Reset form
      setNewCheck({
        driver_id: "",
        vehicle_id: "",
        check_date: new Date().toISOString().split('T')[0],
        lights_working: false,
        tyres_condition: false,
        brakes_working: false,
        mirrors_clean: false,
        seatbelt_working: false,
        horn_working: false,
        steering_responsive: false,
        fluid_levels_ok: false,
        load_securing_equipment: false,
        tailgate_operation: false,
        hydraulics_working: false,
        grab_arm_operation: false,
        defects_noted: "",
        vehicle_clean: false,
        odometer_reading: "",
        fuel_level: ""
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating daily check:", error);
    }
  };

  const getCheckScore = (check: DailyCheck) => {
    const totalItems = checkItems.length;
    const passedItems = checkItems.filter(item => check[item.key as keyof DailyCheck] === true).length;
    return Math.round((passedItems / totalItems) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading driver checks...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Driver Daily Checks</h1>
          <p className="text-muted-foreground">HGV daily walkaround inspections and vehicle checks</p>
        </div>
        <Button variant="default" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Check
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{checks.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Checks</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {checks.filter(c => c.check_date === new Date().toISOString().split('T')[0]).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defects Reported</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {checks.filter(c => c.defects_noted && c.defects_noted.trim() !== "").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {checks.length > 0 ? Math.round(checks.reduce((sum, c) => sum + getCheckScore(c), 0) / checks.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Checks List */}
      <div className="space-y-6">
        {checks.map((check) => {
          const score = getCheckScore(check);
          return (
            <Card key={check.id} className="bg-card border-border shadow-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {check.driver_name}
                    </CardTitle>
                    <CardDescription>
                      {check.vehicle_registration} • {new Date(check.check_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getScoreColor(score)}>
                      {score}% Pass Rate
                    </Badge>
                    {check.defects_noted && check.defects_noted.trim() !== "" && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Defects
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  {checkItems.map((item) => {
                    const isChecked = check[item.key as keyof DailyCheck] === true;
                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${isChecked ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'} flex items-center justify-center`}>
                          {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                {check.defects_noted && check.defects_noted.trim() !== "" && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-red-700">Defects Noted</span>
                    </div>
                    <p className="text-red-600 text-sm">{check.defects_noted}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  {check.odometer_reading && (
                    <div>
                      <span className="text-muted-foreground">Odometer:</span>
                      <div className="font-semibold">{check.odometer_reading.toLocaleString()}</div>
                    </div>
                  )}
                  {check.fuel_level && (
                    <div>
                      <span className="text-muted-foreground">Fuel Level:</span>
                      <div className="font-semibold">{check.fuel_level}%</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Score:</span>
                    <div className="font-semibold">{score}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <div className="font-semibold">{new Date(check.check_date).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {checks.length === 0 && (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No daily checks found</p>
              <Button variant="default" className="mt-4" onClick={() => setShowCreateForm(true)}>
                Complete First Check
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-card border-border shadow-card max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Daily Vehicle Check</CardTitle>
              <CardDescription>Complete your daily HGV walkaround inspection</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createDailyCheck} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="driver_id">Driver</Label>
                    <Select value={newCheck.driver_id} onValueChange={(value) => setNewCheck({...newCheck, driver_id: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vehicle_id">Vehicle</Label>
                    <Select value={newCheck.vehicle_id} onValueChange={(value) => setNewCheck({...newCheck, vehicle_id: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.registration} - {vehicle.vehicle_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="check_date">Check Date</Label>
                    <Input
                      id="check_date"
                      type="date"
                      value={newCheck.check_date}
                      onChange={(e) => setNewCheck({...newCheck, check_date: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Vehicle Checks</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {checkItems.map((item) => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.key}
                          checked={newCheck[item.key as keyof typeof newCheck] as boolean}
                          onCheckedChange={(checked) => setNewCheck({...newCheck, [item.key]: checked})}
                        />
                        <Label htmlFor={item.key} className="text-sm">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="odometer_reading">Odometer Reading</Label>
                    <Input
                      id="odometer_reading"
                      type="number"
                      value={newCheck.odometer_reading}
                      onChange={(e) => setNewCheck({...newCheck, odometer_reading: e.target.value})}
                      className="bg-input border-border"
                      placeholder="e.g. 125000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fuel_level">Fuel Level (%)</Label>
                    <Input
                      id="fuel_level"
                      type="number"
                      min="0"
                      max="100"
                      value={newCheck.fuel_level}
                      onChange={(e) => setNewCheck({...newCheck, fuel_level: e.target.value})}
                      className="bg-input border-border"
                      placeholder="e.g. 75"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="defects_noted">Defects Noted</Label>
                  <Textarea
                    id="defects_noted"
                    value={newCheck.defects_noted}
                    onChange={(e) => setNewCheck({...newCheck, defects_noted: e.target.value})}
                    className="bg-input border-border"
                    placeholder="Note any defects, damage, or issues found during inspection..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="default" className="flex-1">
                    Complete Check
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};