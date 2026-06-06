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
import { ClipboardList, Plus, Eye, FileText, Building2 } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  currency: string;
  notes: string;
  supplier: { company_name: string };
  delivery_depot: { name: string };
}

interface Supplier {
  id: string;
  company_name: string;
}

interface Depot {
  id: string;
  name: string;
}

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: "",
    delivery_depot_id: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchSuppliers();
      fetchDepots();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id, po_number, order_date, status, total_amount, currency, notes,
          supplier:suppliers(company_name),
          delivery_depot:depots(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, company_name").eq("active", true);
    setSuppliers(data || []);
  };

  const fetchDepots = async () => {
    const { data } = await supabase.from("depots").select("id, name").eq("active", true);
    setDepots(data || []);
  };

  const generatePONumber = () => {
    const date = new Date();
    const prefix = "PO";
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("purchase_orders").insert({
        user_id: user?.id,
        supplier_id: formData.supplier_id,
        delivery_depot_id: formData.delivery_depot_id || null,
        po_number: generatePONumber(),
        order_date: new Date().toISOString().split("T")[0],
        notes: formData.notes,
        status: "draft",
      });

      if (error) throw error;
      toast.success("Purchase order created");
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error creating PO:", error);
      toast.error("Failed to create purchase order");
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      delivery_depot_id: "",
      notes: "",
    });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      confirmed: "default",
      received: "default",
      invoiced: "default",
    };
    return colors[status] || "outline";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">
              Manage orders from suppliers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New PO
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>
                  Create a new purchase order from a supplier
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No suppliers yet. Add suppliers first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depot">Delivery Depot</Label>
                  <Select
                    value={formData.delivery_depot_id}
                    onValueChange={(value) => setFormData({ ...formData, delivery_depot_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery depot" />
                    </SelectTrigger>
                    <SelectContent>
                      {depots.map((depot) => (
                        <SelectItem key={depot.id} value={depot.id}>
                          {depot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Order notes"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={!formData.supplier_id}>
                    Create Purchase Order
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No purchase orders yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First PO
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Delivery To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.po_number}
                      </TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {order.supplier?.company_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.delivery_depot?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge variant={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="invoiced">Invoiced</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{order.total_amount?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
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
