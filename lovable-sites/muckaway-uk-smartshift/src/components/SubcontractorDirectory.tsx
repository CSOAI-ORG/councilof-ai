import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, Plus, Star, Trash2, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  waste_carrier_licence: string | null;
  licence_expiry: string | null;
  rate_per_tonne: number | null;
  rate_per_hour: number | null;
  service_types: string[] | null;
  regions_covered: string[] | null;
  active: boolean;
  rating: number | null;
  notes: string | null;
}

const SERVICE_OPTIONS = ['grab_hire', 'tipper', 'skip', 'roll_on_off', 'hazardous', 'recycling'];
const REGION_OPTIONS = ['London', 'South East', 'South West', 'Midlands', 'North', 'Scotland', 'Wales', 'Ireland'];

export function SubcontractorDirectory() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    waste_carrier_licence: '',
    licence_expiry: '',
    rate_per_tonne: '',
    rate_per_hour: '',
    service_types: [] as string[],
    regions_covered: [] as string[],
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const fetchSubcontractors = async () => {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .order('company_name');

    if (error) {
      console.error('Error fetching subcontractors:', error);
    } else {
      setSubcontractors(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      waste_carrier_licence: '',
      licence_expiry: '',
      rate_per_tonne: '',
      rate_per_hour: '',
      service_types: [],
      regions_covered: [],
      notes: ''
    });
    setEditingSubcontractor(null);
  };

  const handleEdit = (sub: Subcontractor) => {
    setEditingSubcontractor(sub);
    setFormData({
      company_name: sub.company_name,
      contact_name: sub.contact_name || '',
      email: sub.email || '',
      phone: sub.phone || '',
      waste_carrier_licence: sub.waste_carrier_licence || '',
      licence_expiry: sub.licence_expiry || '',
      rate_per_tonne: sub.rate_per_tonne?.toString() || '',
      rate_per_hour: sub.rate_per_hour?.toString() || '',
      service_types: sub.service_types || [],
      regions_covered: sub.regions_covered || [],
      notes: sub.notes || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      company_name: formData.company_name,
      contact_name: formData.contact_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      waste_carrier_licence: formData.waste_carrier_licence || null,
      licence_expiry: formData.licence_expiry || null,
      rate_per_tonne: formData.rate_per_tonne ? parseFloat(formData.rate_per_tonne) : null,
      rate_per_hour: formData.rate_per_hour ? parseFloat(formData.rate_per_hour) : null,
      service_types: formData.service_types.length > 0 ? formData.service_types : null,
      regions_covered: formData.regions_covered.length > 0 ? formData.regions_covered : null,
      notes: formData.notes || null,
      user_id: session.user.id
    };

    let error;
    if (editingSubcontractor) {
      const result = await supabase.from('subcontractors').update(payload).eq('id', editingSubcontractor.id);
      error = result.error;
    } else {
      const result = await supabase.from('subcontractors').insert(payload);
      error = result.error;
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to save subcontractor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Subcontractor ${editingSubcontractor ? 'updated' : 'added'}` });
      setIsAddDialogOpen(false);
      resetForm();
      fetchSubcontractors();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('subcontractors').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete subcontractor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Subcontractor deleted' });
      fetchSubcontractors();
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(service)
        ? prev.service_types.filter(s => s !== service)
        : [...prev.service_types, service]
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions_covered: prev.regions_covered.includes(region)
        ? prev.regions_covered.filter(r => r !== region)
        : [...prev.regions_covered, region]
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading subcontractors...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Subcontractor Directory
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Subcontractor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSubcontractor ? 'Edit' : 'Add'} Subcontractor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name *</Label>
                    <Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contact Name</Label>
                    <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Waste Carrier Licence</Label>
                    <Input value={formData.waste_carrier_licence} onChange={(e) => setFormData({ ...formData, waste_carrier_licence: e.target.value })} />
                  </div>
                  <div>
                    <Label>Licence Expiry</Label>
                    <Input type="date" value={formData.licence_expiry} onChange={(e) => setFormData({ ...formData, licence_expiry: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rate per Tonne (£)</Label>
                    <Input type="number" value={formData.rate_per_tonne} onChange={(e) => setFormData({ ...formData, rate_per_tonne: e.target.value })} />
                  </div>
                  <div>
                    <Label>Rate per Hour (£)</Label>
                    <Input type="number" value={formData.rate_per_hour} onChange={(e) => setFormData({ ...formData, rate_per_hour: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Services Offered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SERVICE_OPTIONS.map(service => (
                      <Badge
                        key={service}
                        variant={formData.service_types.includes(service) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleService(service)}
                      >
                        {service.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Regions Covered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {REGION_OPTIONS.map(region => (
                      <Badge
                        key={region}
                        variant={formData.regions_covered.includes(region) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.company_name}>
                  {editingSubcontractor ? 'Update' : 'Add'} Subcontractor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {subcontractors.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No subcontractors found. Add your first subcontractor.</p>
        ) : (
          <div className="grid gap-4">
            {subcontractors.map(sub => (
              <div key={sub.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{sub.company_name}</h3>
                    {sub.contact_name && <p className="text-sm text-muted-foreground">{sub.contact_name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm">{sub.rating}</span>
                      </div>
                    )}
                    <Badge variant={sub.active ? 'default' : 'secondary'}>
                      {sub.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  {sub.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{sub.email}</span>
                    </div>
                  )}
                  {sub.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{sub.phone}</span>
                    </div>
                  )}
                  {sub.waste_carrier_licence && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{sub.waste_carrier_licence}</span>
                    </div>
                  )}
                  {sub.rate_per_tonne && (
                    <div>
                      <span className="text-muted-foreground">Rate:</span> £{sub.rate_per_tonne}/tonne
                    </div>
                  )}
                </div>
                {(sub.service_types?.length || sub.regions_covered?.length) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sub.service_types?.map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s.replace('_', ' ')}</Badge>
                    ))}
                    {sub.regions_covered?.map(r => (
                      <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
