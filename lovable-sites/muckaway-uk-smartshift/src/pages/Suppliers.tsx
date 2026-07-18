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
import { Building2, Plus, Mail, Phone, MapPin, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: string;
  notes: string;
  active: boolean;
}

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "net30",
    notes: "",
  });

  useEffect(() => {
    if (user) fetchSuppliers();
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("company_name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(formData)
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast.success("Supplier updated successfully");
      } else {
        const { error } = await supabase.from("suppliers").insert({
          ...formData,
          user_id: user?.id,
        });

        if (error) throw error;
        toast.success("Supplier created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("Failed to save supplier");
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      company_name: supplier.company_name,
      contact_name: supplier.contact_name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      payment_terms: supplier.payment_terms || "net30",
      notes: supplier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier");
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      payment_terms: "net30",
      notes: "",
    });
  };

  const getPaymentTermsLabel = (terms: string) => {
    const labels: Record<string, string> = {
      net7: "Net 7 days",
      net14: "Net 14 days",
      net30: "Net 30 days",
      net60: "Net 60 days",
      cod: "Cash on Delivery",
    };
    return labels[terms] || terms;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your material suppliers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                <DialogDescription>
                  {editingSupplier ? "Update supplier details" : "Add a new material supplier"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
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
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
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
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="net7">Net 7 days</SelectItem>
                      <SelectItem value="net14">Net 14 days</SelectItem>
                      <SelectItem value="net30">Net 30 days</SelectItem>
                      <SelectItem value="net60">Net 60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">{editingSupplier ? "Update" : "Create"} Supplier</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading suppliers...</p>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers yet</h3>
              <p className="text-muted-foreground mb-4">Add your first supplier to start ordering materials</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {supplier.company_name}
                      </CardTitle>
                      {supplier.contact_name && (
                        <CardDescription>{supplier.contact_name}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${supplier.email}`} className="hover:underline">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${supplier.phone}`} className="hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Badge variant="outline">
                      {getPaymentTermsLabel(supplier.payment_terms)}
                    </Badge>
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
