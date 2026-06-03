import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpRight, ArrowDownRight, Plus, RefreshCw, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

interface StockMovement {
  id: string;
  movement_type: string;
  quantity_tonnes: number;
  unit_price: number;
  total_value: number;
  source_type: string;
  notes: string;
  created_at: string;
  depot: { name: string };
  material_type: { name: string; code: string };
}

interface Depot {
  id: string;
  name: string;
}

interface MaterialType {
  id: string;
  name: string;
  code: string;
}

export default function StockMovements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    depot_id: "",
    material_type_id: "",
    movement_type: "in",
    quantity_tonnes: 0,
    unit_price: 0,
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchMovements();
      fetchDepots();
      fetchMaterials();
    }
  }, [user]);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(`
          id, movement_type, quantity_tonnes, unit_price, total_value, source_type, notes, created_at,
          depot:depots(name),
          material_type:material_types(name, code)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast.error("Failed to load movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepots = async () => {
    const { data } = await supabase.from("depots").select("id, name").eq("active", true);
    setDepots(data || []);
  };

  const fetchMaterials = async () => {
    const { data } = await supabase.from("material_types").select("id, name, code").eq("active", true);
    setMaterials(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalValue = formData.quantity_tonnes * formData.unit_price;

      // Insert movement
      const { error: movementError } = await supabase.from("stock_movements").insert({
        user_id: user?.id,
        depot_id: formData.depot_id,
        material_type_id: formData.material_type_id,
        movement_type: formData.movement_type,
        quantity_tonnes: formData.quantity_tonnes,
        unit_price: formData.unit_price,
        total_value: totalValue,
        source_type: "manual",
        notes: formData.notes,
        created_by: user?.id,
      });

      if (movementError) throw movementError;

      // Update stock level
      const { data: existingStock } = await supabase
        .from("stock_levels")
        .select("id, quantity_tonnes")
        .eq("depot_id", formData.depot_id)
        .eq("material_type_id", formData.material_type_id)
        .maybeSingle();

      const quantityChange = formData.movement_type === "in" ? formData.quantity_tonnes : -formData.quantity_tonnes;

      if (existingStock) {
        await supabase
          .from("stock_levels")
          .update({ quantity_tonnes: existingStock.quantity_tonnes + quantityChange })
          .eq("id", existingStock.id);
      } else {
        await supabase.from("stock_levels").insert({
          user_id: user?.id,
          depot_id: formData.depot_id,
          material_type_id: formData.material_type_id,
          quantity_tonnes: Math.max(0, quantityChange),
        });
      }

      toast.success("Stock movement recorded");
      setDialogOpen(false);
      resetForm();
      fetchMovements();
    } catch (error) {
      console.error("Error saving movement:", error);
      toast.error("Failed to record movement");
    }
  };

  const resetForm = () => {
    setFormData({
      depot_id: "",
      material_type_id: "",
      movement_type: "in",
      quantity_tonnes: 0,
      unit_price: 0,
      notes: "",
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case "out":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in: "default",
      out: "destructive",
      transfer: "secondary",
      adjustment: "outline",
    };
    return variants[type] || "outline";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Movements</h1>
            <p className="text-muted-foreground">
              Track all inventory changes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Movement</DialogTitle>
                <DialogDescription>
                  Add a new stock in/out movement
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="movement_type">Movement Type</Label>
                  <Select
                    value={formData.movement_type}
                    onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In (Receipt)</SelectItem>
                      <SelectItem value="out">Stock Out (Dispatch)</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depot">Depot</Label>
                  <Select
                    value={formData.depot_id}
                    onValueChange={(value) => setFormData({ ...formData, depot_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select depot" />
                    </SelectTrigger>
                    <SelectContent>
                      {depots.map((depot) => (
                        <SelectItem key={depot.id} value={depot.id}>{depot.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select
                    value={formData.material_type_id}
                    onValueChange={(value) => setFormData({ ...formData, material_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.code} - {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (tonnes)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity_tonnes}
                      onChange={(e) => setFormData({ ...formData, quantity_tonnes: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price (£)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={!formData.depot_id || !formData.material_type_id}>
                    Record Movement
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center py-8">Loading movements...</p>
            ) : movements.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No stock movements recorded yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Movement
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movement_type)}
                          <Badge variant={getMovementBadge(movement.movement_type)}>
                            {movement.movement_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{movement.depot?.name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{movement.material_type?.code}</span>
                        <span className="ml-2">{movement.material_type?.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {movement.movement_type === "in" ? "+" : "-"}
                        {movement.quantity_tonnes}t
                      </TableCell>
                      <TableCell className="text-right">
                        £{movement.unit_price?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        £{movement.total_value?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {movement.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
