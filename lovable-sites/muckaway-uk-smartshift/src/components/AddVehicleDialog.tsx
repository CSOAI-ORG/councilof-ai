import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vehicle?: any;
}

export const AddVehicleDialog = ({ open, onOpenChange, onSuccess, vehicle }: AddVehicleDialogProps) => {
  const [formData, setFormData] = useState({
    registration: vehicle?.registration || "",
    vehicle_type: vehicle?.vehicle_type || "",
    capacity_tonnes: vehicle?.capacity_tonnes || "",
    mot_expiry: vehicle?.mot_expiry || "",
    last_service: vehicle?.last_service || "",
    next_service_due: vehicle?.next_service_due || "",
    active: vehicle?.active ?? true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        capacity_tonnes: formData.capacity_tonnes ? parseFloat(formData.capacity_tonnes) : null,
        mot_expiry: formData.mot_expiry || null,
        last_service: formData.last_service || null,
        next_service_due: formData.next_service_due || null
      };

      if (vehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(data)
          .eq("id", vehicle.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert([data]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vehicle added successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        registration: "",
        vehicle_type: "",
        capacity_tonnes: "",
        mot_expiry: "",
        last_service: "",
        next_service_due: "",
        active: true
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update vehicle details" : "Add a new vehicle to your fleet"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="registration">Registration Number</Label>
            <Input
              id="registration"
              value={formData.registration}
              onChange={(e) => setFormData({...formData, registration: e.target.value})}
              placeholder="e.g. AB12 CDE"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({...formData, vehicle_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tipper_truck">Tipper Truck</SelectItem>
                <SelectItem value="grab_lorry">Grab Lorry</SelectItem>
                <SelectItem value="hook_loader">Hook Loader</SelectItem>
                <SelectItem value="roll_on_off">Roll On/Off</SelectItem>
                <SelectItem value="skip_loader">Skip Loader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="capacity">Capacity (tonnes)</Label>
            <Input
              id="capacity"
              type="number"
              step="0.1"
              value={formData.capacity_tonnes}
              onChange={(e) => setFormData({...formData, capacity_tonnes: e.target.value})}
              placeholder="e.g. 20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mot_expiry">MOT Expiry</Label>
              <Input
                id="mot_expiry"
                type="date"
                value={formData.mot_expiry}
                onChange={(e) => setFormData({...formData, mot_expiry: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="last_service">Last Service</Label>
              <Input
                id="last_service"
                type="date"
                value={formData.last_service}
                onChange={(e) => setFormData({...formData, last_service: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="next_service">Next Service Due</Label>
            <Input
              id="next_service"
              type="date"
              value={formData.next_service_due}
              onChange={(e) => setFormData({...formData, next_service_due: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label htmlFor="active">Active Vehicle</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};