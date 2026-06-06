import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Warehouse, Plus, MapPin, Phone, User, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Depot {
  id: string;
  name: string;
  address: string;
  postcode: string;
  contact_name: string;
  contact_phone: string;
  capacity_tonnes: number;
  current_utilization: number;
  depot_type: string;
  active: boolean;
}

export default function DepotsManagement() {
  const { user } = useAuth();
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postcode: "",
    contact_name: "",
    contact_phone: "",
    capacity_tonnes: 1000,
    depot_type: "yard",
  });

  useEffect(() => {
    if (user) fetchDepots();
  }, [user]);

  const fetchDepots = async () => {
    try {
      const { data, error } = await supabase
        .from("depots")
        .select("*")
        .order("name");

      if (error) throw error;
      setDepots(data || []);
    } catch (error) {
      console.error("Error fetching depots:", error);
      toast.error("Failed to load depots");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepot) {
        const { error } = await supabase
          .from("depots")
          .update(formData)
          .eq("id", editingDepot.id);

        if (error) throw error;
        toast.success("Depot updated successfully");
      } else {
        const { error } = await supabase.from("depots").insert({
          ...formData,
          user_id: user?.id,
        });

        if (error) throw error;
        toast.success("Depot created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchDepots();
    } catch (error) {
      console.error("Error saving depot:", error);
      toast.error("Failed to save depot");
    }
  };

  const handleEdit = (depot: Depot) => {
    setEditingDepot(depot);
    setFormData({
      name: depot.name,
      address: depot.address || "",
      postcode: depot.postcode || "",
      contact_name: depot.contact_name || "",
      contact_phone: depot.contact_phone || "",
      capacity_tonnes: depot.capacity_tonnes,
      depot_type: depot.depot_type,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this depot?")) return;

    try {
      const { error } = await supabase.from("depots").delete().eq("id", id);
      if (error) throw error;
      toast.success("Depot deleted");
      fetchDepots();
    } catch (error) {
      console.error("Error deleting depot:", error);
      toast.error("Failed to delete depot");
    }
  };

  const resetForm = () => {
    setEditingDepot(null);
    setFormData({
      name: "",
      address: "",
      postcode: "",
      contact_name: "",
      contact_phone: "",
      capacity_tonnes: 1000,
      depot_type: "yard",
    });
  };

  const getDepotTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      yard: "Yard",
      recycling_plant: "Recycling Plant",
      transfer_station: "Transfer Station",
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Depots & Yards</h1>
            <p className="text-muted-foreground">
              Manage your storage locations
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Depot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDepot ? "Edit Depot" : "Add New Depot"}</DialogTitle>
                <DialogDescription>
                  {editingDepot ? "Update depot details" : "Add a new storage location"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Depot Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depot_type">Depot Type</Label>
                  <Select
                    value={formData.depot_type}
                    onValueChange={(value) => setFormData({ ...formData, depot_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yard">Yard</SelectItem>
                      <SelectItem value="recycling_plant">Recycling Plant</SelectItem>
                      <SelectItem value="transfer_station">Transfer Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (tonnes)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity_tonnes}
                    onChange={(e) => setFormData({ ...formData, capacity_tonnes: Number(e.target.value) })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">{editingDepot ? "Update" : "Create"} Depot</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading depots...</p>
        ) : depots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No depots yet</h3>
              <p className="text-muted-foreground mb-4">Add your first depot to start managing stock</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Depot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {depots.map((depot) => (
              <Card key={depot.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Warehouse className="h-5 w-5" />
                        {depot.name}
                      </CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-1">
                          {getDepotTypeLabel(depot.depot_type)}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(depot)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(depot.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {depot.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{depot.address}, {depot.postcode}</span>
                    </div>
                  )}
                  {depot.contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{depot.contact_name}</span>
                    </div>
                  )}
                  {depot.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{depot.contact_phone}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Capacity: <span className="font-medium text-foreground">{depot.capacity_tonnes}t</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
