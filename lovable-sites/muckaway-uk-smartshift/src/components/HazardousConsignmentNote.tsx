import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, CheckCircle, Clock, Signature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HazardousNote {
  id: string;
  job_id: string;
  consignment_number: string;
  producer_name: string;
  producer_address: string;
  carrier_name: string;
  carrier_licence: string;
  waste_description: string;
  ewc_code: string;
  physical_form: string;
  quantity_tonnes: number;
  container_type: string;
  hazard_codes: string[];
  special_handling_requirements: string;
  destination_site_name: string;
  destination_address: string;
  destination_permit: string;
  status: string;
  section_a_date: string;
  section_b_date?: string;
  section_c_date?: string;
  section_d_date?: string;
  section_e_date?: string;
}

export const HazardousConsignmentNote = () => {
  const [notes, setNotes] = useState<HazardousNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [newNote, setNewNote] = useState({
    job_id: "",
    producer_name: "",
    producer_address: "",
    carrier_name: "",
    carrier_licence: "",
    waste_description: "",
    ewc_code: "",
    physical_form: "solid",
    quantity_tonnes: "",
    container_type: "skip",
    hazard_codes: [] as string[],
    special_handling_requirements: "",
    destination_site_name: "",
    destination_address: "",
    destination_permit: ""
  });

  const hazardCodes = [
    "H1 - Explosive", "H2 - Oxidising", "H3A - Highly flammable", "H3B - Flammable",
    "H4 - Irritant", "H5 - Harmful", "H6 - Toxic", "H7 - Carcinogenic",
    "H8 - Corrosive", "H9 - Infectious", "H10 - Teratogenic", "H11 - Mutagenic",
    "H12 - Ecotoxic", "H13 - Sensitising", "H14 - Ecotoxic", "H15 - Waste capable of yielding another substance"
  ];

  useEffect(() => {
    loadHazardousNotes();
  }, []);

  const loadHazardousNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("hazardous_consignment_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading hazardous notes:", error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error("Error loading hazardous notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const createHazardousNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate unique consignment number
      const consignmentNumber = `HCN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { error } = await supabase
        .from("hazardous_consignment_notes")
        .insert({
          ...newNote,
          consignment_number: consignmentNumber,
          quantity_tonnes: parseFloat(newNote.quantity_tonnes),
          status: 'section_a_completed'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create hazardous consignment note",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Hazardous consignment note created successfully",
      });

      setNewNote({
        job_id: "",
        producer_name: "",
        producer_address: "",
        carrier_name: "",
        carrier_licence: "",
        waste_description: "",
        ewc_code: "",
        physical_form: "solid",
        quantity_tonnes: "",
        container_type: "skip",
        hazard_codes: [],
        special_handling_requirements: "",
        destination_site_name: "",
        destination_address: "",
        destination_permit: ""
      });
      setShowCreateForm(false);
      loadHazardousNotes();
    } catch (error) {
      console.error("Error creating hazardous note:", error);
    }
  };

  const updateNoteSection = async (noteId: string, section: string) => {
    try {
      const updateData: any = {};
      updateData[`section_${section}_date`] = new Date().toISOString();
      updateData[`section_${section}_signature`] = "Digital Signature"; // In real app, this would be actual signature
      
      // Update status based on section
      if (section === 'e') {
        updateData.status = 'completed';
      } else {
        updateData.status = `section_${section}_completed`;
      }

      const { error } = await supabase
        .from("hazardous_consignment_notes")
        .update(updateData)
        .eq("id", noteId);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to update section ${section.toUpperCase()}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Section ${section.toUpperCase()} completed successfully`,
      });

      loadHazardousNotes();
    } catch (error) {
      console.error("Error updating note section:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted text-muted-foreground";
      case "section_a_completed":
        return "bg-primary/10 text-primary";
      case "section_b_completed":
      case "section_c_completed":
      case "section_d_completed":
        return "bg-accent/10 text-accent";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading hazardous consignment notes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hazardous Consignment Notes</h1>
          <p className="text-muted-foreground">Manage hazardous waste consignment documentation</p>
        </div>
        <Button variant="action" onClick={() => setShowCreateForm(true)}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Create HCN
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total HCNs</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{notes.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notes.filter(n => n.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {notes.filter(n => n.status !== 'completed' && n.status !== 'draft').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tonnage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {notes.reduce((sum, n) => sum + n.quantity_tonnes, 0).toFixed(1)}t
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hazardous Notes List */}
      <div className="space-y-6">
        {notes.map((note) => (
          <Card key={note.id} className="bg-card border-border shadow-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    {note.consignment_number}
                  </CardTitle>
                  <CardDescription>
                    {note.waste_description} • {note.quantity_tonnes}t • {note.ewc_code}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(note.status)}>
                  {note.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="hazards">Hazards</TabsTrigger>
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Producer:</span>
                      <div className="font-semibold">{note.producer_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carrier:</span>
                      <div className="font-semibold">{note.carrier_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destination:</span>
                      <div className="font-semibold">{note.destination_site_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Container:</span>
                      <div className="font-semibold">{note.container_type}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sections" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {['a', 'b', 'c', 'd', 'e'].map((section) => {
                      const isCompleted = note[`section_${section}_date` as keyof HazardousNote];
                      const canComplete = section === 'a' || 
                        (section === 'b' && note.section_a_date) ||
                        (section === 'c' && note.section_b_date) ||
                        (section === 'd' && note.section_c_date) ||
                        (section === 'e' && note.section_d_date);
                      
                      return (
                        <div key={section} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Section {section.toUpperCase()}</span>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {isCompleted ? (
                            <div className="text-sm text-muted-foreground">
                              {new Date(isCompleted as string).toLocaleDateString()}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={canComplete ? "action" : "outline"}
                              disabled={!canComplete}
                              onClick={() => updateNoteSection(note.id, section)}
                            >
                              <Signature className="h-3 w-3 mr-1" />
                              Sign
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="hazards" className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {note.hazard_codes.map((code) => (
                      <Badge key={code} className="bg-accent/10 text-accent">
                        {code}
                      </Badge>
                    ))}
                  </div>
                  {note.special_handling_requirements && (
                    <div>
                      <span className="text-muted-foreground text-sm">Special Handling:</span>
                      <p className="mt-1">{note.special_handling_requirements}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(note.section_a_date).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    Status: <span className="font-semibold">{note.status.replace(/_/g, ' ')}</span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}

        {notes.length === 0 && (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hazardous consignment notes found</p>
              <Button variant="action" className="mt-4" onClick={() => setShowCreateForm(true)}>
                Create First HCN
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-card border-border shadow-card max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Hazardous Consignment Note</CardTitle>
              <CardDescription>Complete all sections for hazardous waste documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createHazardousNote} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="producer_name">Producer Name</Label>
                    <Input
                      id="producer_name"
                      value={newNote.producer_name}
                      onChange={(e) => setNewNote({...newNote, producer_name: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier_name">Carrier Name</Label>
                    <Input
                      id="carrier_name"
                      value={newNote.carrier_name}
                      onChange={(e) => setNewNote({...newNote, carrier_name: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="producer_address">Producer Address</Label>
                    <Textarea
                      id="producer_address"
                      value={newNote.producer_address}
                      onChange={(e) => setNewNote({...newNote, producer_address: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier_licence">Carrier Licence</Label>
                    <Input
                      id="carrier_licence"
                      value={newNote.carrier_licence}
                      onChange={(e) => setNewNote({...newNote, carrier_licence: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="waste_description">Waste Description</Label>
                    <Input
                      id="waste_description"
                      value={newNote.waste_description}
                      onChange={(e) => setNewNote({...newNote, waste_description: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ewc_code">EWC Code</Label>
                    <Input
                      id="ewc_code"
                      value={newNote.ewc_code}
                      onChange={(e) => setNewNote({...newNote, ewc_code: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity_tonnes">Quantity (tonnes)</Label>
                    <Input
                      id="quantity_tonnes"
                      type="number"
                      step="0.1"
                      value={newNote.quantity_tonnes}
                      onChange={(e) => setNewNote({...newNote, quantity_tonnes: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="physical_form">Physical Form</Label>
                    <Select value={newNote.physical_form} onValueChange={(value) => setNewNote({...newNote, physical_form: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="sludge">Sludge</SelectItem>
                        <SelectItem value="gas">Gas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="container_type">Container Type</Label>
                    <Select value={newNote.container_type} onValueChange={(value) => setNewNote({...newNote, container_type: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        <SelectItem value="bulk">Bulk</SelectItem>
                        <SelectItem value="drum">Drum</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="tank">Tank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="destination_site_name">Destination Site</Label>
                    <Input
                      id="destination_site_name"
                      value={newNote.destination_site_name}
                      onChange={(e) => setNewNote({...newNote, destination_site_name: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination_permit">Destination Permit</Label>
                    <Input
                      id="destination_permit"
                      value={newNote.destination_permit}
                      onChange={(e) => setNewNote({...newNote, destination_permit: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="destination_address">Destination Address</Label>
                  <Textarea
                    id="destination_address"
                    value={newNote.destination_address}
                    onChange={(e) => setNewNote({...newNote, destination_address: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div>
                  <Label>Hazard Codes</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {hazardCodes.map((code) => (
                      <label key={code} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newNote.hazard_codes.includes(code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewNote({...newNote, hazard_codes: [...newNote.hazard_codes, code]});
                            } else {
                              setNewNote({...newNote, hazard_codes: newNote.hazard_codes.filter(h => h !== code)});
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{code}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="special_handling">Special Handling Requirements</Label>
                  <Textarea
                    id="special_handling"
                    value={newNote.special_handling_requirements}
                    onChange={(e) => setNewNote({...newNote, special_handling_requirements: e.target.value})}
                    className="bg-input border-border"
                    placeholder="Any special handling requirements or notes..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="action" className="flex-1">
                    Create HCN
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};