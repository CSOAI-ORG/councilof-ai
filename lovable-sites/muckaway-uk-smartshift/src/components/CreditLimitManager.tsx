import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CreditCard, DollarSign, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  credit_limit: number | null;
  credit_terms_days: number | null;
  current_balance: number | null;
  payment_terms: string | null;
}

export function CreditLimitManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Customer>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('customers')
      .select('id, company_name, contact_name, credit_limit, credit_terms_days, current_balance, payment_terms')
      .order('company_name');

    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditValues({
      credit_limit: customer.credit_limit || 0,
      credit_terms_days: customer.credit_terms_days || 30,
      payment_terms: customer.payment_terms || 'net30'
    });
  };

  const handleSave = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({
        credit_limit: editValues.credit_limit,
        credit_terms_days: editValues.credit_terms_days,
        payment_terms: editValues.payment_terms
      })
      .eq('id', customerId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update credit settings', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Credit settings updated' });
      setEditingId(null);
      fetchCustomers();
    }
  };

  const getCreditStatus = (customer: Customer) => {
    const balance = customer.current_balance || 0;
    const limit = customer.credit_limit || 0;
    
    if (limit === 0) return { status: 'none', label: 'No Limit' };
    const percentage = (balance / limit) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', label: 'Exceeded' };
    if (percentage >= 80) return { status: 'warning', label: 'Near Limit' };
    return { status: 'ok', label: 'Good' };
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading customers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Customer Credit Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customers found. Add customers to manage their credit.</p>
          ) : (
            customers.map(customer => {
              const creditStatus = getCreditStatus(customer);
              const isEditing = editingId === customer.id;

              return (
                <div key={customer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{customer.company_name || customer.contact_name || 'Unnamed Customer'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Balance: £{(customer.current_balance || 0).toLocaleString()} / £{(customer.credit_limit || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        creditStatus.status === 'exceeded' ? 'destructive' :
                        creditStatus.status === 'warning' ? 'secondary' : 'default'
                      }>
                        {creditStatus.status === 'exceeded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {creditStatus.label}
                      </Badge>
                      {!isEditing && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                      <div>
                        <Label>Credit Limit (£)</Label>
                        <Input
                          type="number"
                          value={editValues.credit_limit || 0}
                          onChange={(e) => setEditValues({ ...editValues, credit_limit: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Payment Terms (Days)</Label>
                        <Input
                          type="number"
                          value={editValues.credit_terms_days || 30}
                          onChange={(e) => setEditValues({ ...editValues, credit_terms_days: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Terms Type</Label>
                        <Select
                          value={editValues.payment_terms || 'net30'}
                          onValueChange={(value) => setEditValues({ ...editValues, payment_terms: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="net7">Net 7</SelectItem>
                            <SelectItem value="net14">Net 14</SelectItem>
                            <SelectItem value="net30">Net 30</SelectItem>
                            <SelectItem value="net60">Net 60</SelectItem>
                            <SelectItem value="cod">Cash on Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3 flex gap-2">
                        <Button onClick={() => handleSave(customer.id)} size="sm">
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
