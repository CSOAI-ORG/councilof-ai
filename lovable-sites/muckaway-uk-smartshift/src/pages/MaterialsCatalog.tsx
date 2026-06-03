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
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MaterialType {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  default_buy_price: number;
  default_sell_price: number;
  ewc_code: string;
  requires_testing: boolean;
  description: string;
  active: boolean;
}

export default function MaterialsCatalog() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "aggregate",
    unit: "tonnes",
    default_buy_price: 0,
    default_sell_price: 0,
    ewc_code: "",
    requires_testing: false,
    description: "",
  });

  useEffect(() => {
    if (user) fetchMaterials();
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("material_types")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from("material_types")
          .update(formData)
          .eq("id", editingMaterial.id);

        if (error) throw error;
        toast.success("Material updated successfully");
      } else {
        const { error } = await supabase.from("material_types").insert({
          ...formData,
          user_id: user?.id,
        });

        if (error) throw error;
        toast.success("Material created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error("Failed to save material");
    }
  };

  const handleEdit = (material: MaterialType) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.unit,
      default_buy_price: material.default_buy_price,
      default_sell_price: material.default_sell_price,
      ewc_code: material.ewc_code || "",
      requires_testing: material.requires_testing,
      description: material.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error } = await supabase.from("material_types").delete().eq("id", id);
      if (error) throw error;
      toast.success("Material deleted");
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      code: "",
      name: "",
      category: "aggregate",
      unit: "tonnes",
      default_buy_price: 0,
      default_sell_price: 0,
      ewc_code: "",
      requires_testing: false,
      description: "",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      aggregate: "bg-blue-500",
      waste: "bg-orange-500",
      recyclate: "bg-green-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Materials Catalog</h1>
            <p className="text-muted-foreground">
              Manage material types and pricing
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
                <DialogDescription>
                  {editingMaterial ? "Update material details" : "Add a new material type to your catalog"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., AGG001"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Type 1 MOT"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                        <SelectItem value="waste">Waste</SelectItem>
                        <SelectItem value="recyclate">Recyclate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tonnes">Tonnes</SelectItem>
                        <SelectItem value="cubic_metres">Cubic Metres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buy_price">Buy Price (£/t)</Label>
                    <Input
                      id="buy_price"
                      type="number"
                      step="0.01"
                      value={formData.default_buy_price}
                      onChange={(e) => setFormData({ ...formData, default_buy_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sell_price">Sell Price (£/t)</Label>
                    <Input
                      id="sell_price"
                      type="number"
                      step="0.01"
                      value={formData.default_sell_price}
                      onChange={(e) => setFormData({ ...formData, default_sell_price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ewc_code">EWC Code</Label>
                  <Input
                    id="ewc_code"
                    placeholder="e.g., 17 05 04"
                    value={formData.ewc_code}
                    onChange={(e) => setFormData({ ...formData, ewc_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">{editingMaterial ? "Update" : "Create"} Material</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading materials...</p>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
              <p className="text-muted-foreground mb-4">Add your first material type to your catalog</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>EWC Code</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-mono">{material.code}</TableCell>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(material.category)}>
                          {material.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {material.ewc_code || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        £{material.default_buy_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        £{material.default_sell_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={material.default_sell_price - material.default_buy_price > 0 ? "text-green-500" : "text-red-500"}>
                          £{(material.default_sell_price - material.default_buy_price).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
