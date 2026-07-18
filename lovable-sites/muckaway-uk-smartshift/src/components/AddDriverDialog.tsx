import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  driver?: any;
}

export const AddDriverDialog = ({ open, onOpenChange, onSuccess, driver }: AddDriverDialogProps) => {
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    licence_number: driver?.licence_number || "",
    licence_expiry: driver?.licence_expiry || "",
    phone: driver?.phone || "",
    active: driver?.active ?? true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        licence_expiry: formData.licence_expiry || null,
        phone: formData.phone || null
      };

      if (driver) {
        const { error } = await supabase
          .from("drivers")
          .update(data)
          .eq("id", driver.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Driver updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("drivers")
          .insert([data]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Driver added successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        licence_number: "",
        licence_expiry: "",
        phone: "",
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
          <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
          <DialogDescription>
            {driver ? "Update driver details" : "Add a new driver to your fleet"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Smith"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="licence_number">Driving Licence Number</Label>
            <Input
              id="licence_number"
              value={formData.licence_number}
              onChange={(e) => setFormData({...formData, licence_number: e.target.value})}
              placeholder="e.g. SMITH123456789"
              required
            />
          </div>

          <div>
            <Label htmlFor="licence_expiry">Licence Expiry Date</Label>
            <Input
              id="licence_expiry"
              type="date"
              value={formData.licence_expiry}
              onChange={(e) => setFormData({...formData, licence_expiry: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. 07123 456789"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label htmlFor="active">Active Driver</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : driver ? "Update Driver" : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};