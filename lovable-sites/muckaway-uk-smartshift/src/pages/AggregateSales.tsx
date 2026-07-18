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
import { ShoppingCart, Plus, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

interface AggregateSale {
  id: string;
  sale_number: string;
  sale_date: string;
  status: string;
  delivery_address: string;
  delivery_date: string;
  total_amount: number;
  currency: string;
  notes: string;
  customer: { company_name: string; contact_name: string };
}

interface Customer {
  id: string;
  company_name: string;
}

export default function AggregateSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<AggregateSale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    delivery_address: "",
    delivery_date: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchCustomers();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("aggregate_sales")
        .select(`
          id, sale_number, sale_date, status, delivery_address, delivery_date, total_amount, currency, notes,
          customer:customers(company_name, contact_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, company_name");
    setCustomers(data || []);
  };

  const generateSaleNumber = () => {
    const date = new Date();
    const prefix = "SALE";
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("aggregate_sales").insert({
        user_id: user?.id,
        customer_id: formData.customer_id || null,
        sale_number: generateSaleNumber(),
        sale_date: new Date().toISOString().split("T")[0],
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date || null,
        notes: formData.notes,
        status: "quote",
      });

      if (error) throw error;
      toast.success("Sale order created");
      setDialogOpen(false);
      resetForm();
      fetchSales();
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Failed to create sale");
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      delivery_address: "",
      delivery_date: "",
      notes: "",
    });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("aggregate_sales")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchSales();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      quote: "outline",
      confirmed: "default",
      delivered: "secondary",
      invoiced: "default",
      paid: "default",
    };
    return colors[status] || "outline";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Aggregate Sales</h1>
            <p className="text-muted-foreground">
              Manage material sales to customers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sale</DialogTitle>
                <DialogDescription>
                  Create a new aggregate sale order
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <Input
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    placeholder="Delivery location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
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
                  <Button type="submit">Create Sale Order</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center py-8">Loading sales...</p>
            ) : sales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No sales orders yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Sale
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-medium">
                        {sale.sale_number}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {sale.customer?.company_name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sale.delivery_date
                          ? new Date(sale.delivery_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sale.status}
                          onValueChange={(value) => updateStatus(sale.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge variant={getStatusColor(sale.status)}>
                              {sale.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quote">Quote</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="invoiced">Invoiced</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{sale.total_amount?.toFixed(2) || "0.00"}
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
