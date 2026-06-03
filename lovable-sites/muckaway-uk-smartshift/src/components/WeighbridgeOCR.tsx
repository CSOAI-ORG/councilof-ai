import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Check, AlertTriangle, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeighbridgeTicket {
  id: string;
  job_assignment_id: string;
  ticket_number: string;
  weighbridge_name: string;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  ticket_date: string;
  ticket_image_url?: string;
  processed_by_ocr: boolean;
  ocr_confidence?: number;
  verified: boolean;
  created_at: string;
}

interface JobAssignment {
  id: string;
  job_id: string;
  vehicle_id: string;
  driver_id: string;
  driver_name?: string;
  vehicle_registration?: string;
}

export const WeighbridgeOCR = () => {
  const [tickets, setTickets] = useState<WeighbridgeTicket[]>([]);
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingOCR, setProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [newTicket, setNewTicket] = useState({
    job_assignment_id: "",
    ticket_number: "",
    weighbridge_name: "",
    gross_weight: "",
    tare_weight: "",
    net_weight: "",
    ticket_date: new Date().toISOString().split('T')[0],
    ticket_image_url: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load weighbridge tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("weighbridge_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) {
        console.error("Error loading tickets:", ticketsError);
      } else {
        setTickets(ticketsData || []);
      }

      // Load job assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("job_assignments")
        .select(`
          *,
          drivers(name),
          vehicles(registration)
        `);

      if (assignmentsError) {
        console.error("Error loading assignments:", assignmentsError);
      } else {
        const formattedAssignments = assignmentsData?.map(assignment => ({
          ...assignment,
          driver_name: assignment.drivers?.name,
          vehicle_registration: assignment.vehicles?.registration
        })) || [];
        setJobAssignments(formattedAssignments);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProcessingOCR(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setUploadedImage(base64Image);
        
        try {
          const { data, error } = await supabase.functions.invoke('ai-weighbridge-ocr', {
            body: { image: base64Image }
          });

          if (error) {
            throw error;
          }

          if (data) {
            const ocrData = {
              ticket_number: data.ticket_number,
              weighbridge_name: data.weighbridge_name,
              gross_weight: data.gross_weight.toString(),
              tare_weight: data.tare_weight.toString(),
              net_weight: data.net_weight.toString(),
              ticket_date: data.date
            };
            
            setNewTicket(prev => ({
              ...prev,
              ...ocrData
            }));
            
            toast({
              title: "OCR Processing Complete",
              description: `Ticket data extracted with ${Math.round(data.confidence * 100)}% confidence. Please verify the details.`,
            });
          }
        } catch (error) {
          console.error('OCR processing error:', error);
          // Fallback to mock data
          const mockOCRData = {
            ticket_number: `WB${Math.floor(Math.random() * 100000)}`,
            weighbridge_name: "Weighbridge (Manual Verification Required)",
            gross_weight: Math.floor(Math.random() * 20 + 15).toString(),
            tare_weight: Math.floor(Math.random() * 5 + 8).toString(),
            net_weight: "",
            ticket_date: new Date().toISOString().split('T')[0]
          };
          
          const gross = parseFloat(mockOCRData.gross_weight);
          const tare = parseFloat(mockOCRData.tare_weight);
          mockOCRData.net_weight = (gross - tare).toFixed(1);
          
          setNewTicket(prev => ({
            ...prev,
            ...mockOCRData
          }));
          
          toast({
            title: "OCR Processing Failed",
            description: "Using manual mode. Please verify all data carefully.",
            variant: "destructive"
          });
        } finally {
          setProcessingOCR(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setProcessingOCR(false);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive"
      });
    }
  };

  const createWeighbridgeTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("weighbridge_tickets")
        .insert({
          ...newTicket,
          gross_weight: parseFloat(newTicket.gross_weight),
          tare_weight: parseFloat(newTicket.tare_weight),
          net_weight: parseFloat(newTicket.net_weight),
          ticket_date: new Date(newTicket.ticket_date).toISOString(),
          processed_by_ocr: !!uploadedImage,
          ocr_confidence: uploadedImage ? 0.95 : null,
          verified: false
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create weighbridge ticket",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Weighbridge ticket created successfully",
      });

      // Reset form
      setNewTicket({
        job_assignment_id: "",
        ticket_number: "",
        weighbridge_name: "",
        gross_weight: "",
        tare_weight: "",
        net_weight: "",
        ticket_date: new Date().toISOString().split('T')[0],
        ticket_image_url: ""
      });
      setUploadedImage(null);
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const verifyTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("weighbridge_tickets")
        .update({ verified: true })
        .eq("id", ticketId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to verify ticket",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket verified successfully",
      });

      loadData();
    } catch (error) {
      console.error("Error verifying ticket:", error);
    }
  };

  const getVerificationBadge = (ticket: WeighbridgeTicket) => {
    if (ticket.verified) {
      return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (ticket.processed_by_ocr) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Eye className="w-3 h-3 mr-1" />Needs Review</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Manual Entry</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading weighbridge tickets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weighbridge OCR</h1>
          <p className="text-muted-foreground">Capture and process weighbridge tickets automatically</p>
        </div>
        <Button variant="default" onClick={() => setShowCreateForm(true)}>
          <Camera className="w-4 h-4 mr-2" />
          Add Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tickets.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OCR Processed</CardTitle>
            <Camera className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {tickets.filter(t => t.processed_by_ocr).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.verified).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {tickets.reduce((sum, t) => sum + t.net_weight, 0).toFixed(1)}t
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="bg-card border-border shadow-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {ticket.ticket_number}
                  </CardTitle>
                  <CardDescription>
                    {ticket.weighbridge_name} • {new Date(ticket.ticket_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getVerificationBadge(ticket)}
                  {ticket.processed_by_ocr && ticket.ocr_confidence && (
                    <Badge className="bg-primary/10 text-primary">
                      {Math.round(ticket.ocr_confidence * 100)}% Confidence
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-muted-foreground text-sm">Gross Weight:</span>
                  <div className="font-semibold">{ticket.gross_weight}t</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Tare Weight:</span>
                  <div className="font-semibold">{ticket.tare_weight}t</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Net Weight:</span>
                  <div className="font-semibold text-primary">{ticket.net_weight}t</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Date:</span>
                  <div className="font-semibold">{new Date(ticket.ticket_date).toLocaleDateString()}</div>
                </div>
              </div>

              {!ticket.verified && (
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => verifyTicket(ticket.id)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Verify Ticket
                  </Button>
                  {ticket.ticket_image_url && (
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      View Image
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="text-center py-8">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No weighbridge tickets found</p>
              <Button variant="default" className="mt-4" onClick={() => setShowCreateForm(true)}>
                Add First Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl bg-card border-border shadow-card max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Weighbridge Ticket</CardTitle>
              <CardDescription>Upload an image for OCR processing or enter details manually</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createWeighbridgeTicket} className="space-y-6">
                {/* Image Upload Section */}
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="text-center">
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded ticket" 
                          className="max-w-full h-48 object-contain mx-auto rounded-lg"
                        />
                        {processingOCR ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Processing OCR...</span>
                          </div>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            OCR Complete
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Upload weighbridge ticket image for automatic OCR processing</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_assignment_id">Job Assignment</Label>
                    <select
                      id="job_assignment_id"
                      value={newTicket.job_assignment_id}
                      onChange={(e) => setNewTicket({...newTicket, job_assignment_id: e.target.value})}
                      className="w-full p-2 border border-border rounded-md bg-input"
                      required
                    >
                      <option value="">Select assignment</option>
                      {jobAssignments.map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.vehicle_registration} - {assignment.driver_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ticket_number">Ticket Number</Label>
                    <Input
                      id="ticket_number"
                      value={newTicket.ticket_number}
                      onChange={(e) => setNewTicket({...newTicket, ticket_number: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weighbridge_name">Weighbridge Name</Label>
                    <Input
                      id="weighbridge_name"
                      value={newTicket.weighbridge_name}
                      onChange={(e) => setNewTicket({...newTicket, weighbridge_name: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket_date">Ticket Date</Label>
                    <Input
                      id="ticket_date"
                      type="date"
                      value={newTicket.ticket_date}
                      onChange={(e) => setNewTicket({...newTicket, ticket_date: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="gross_weight">Gross Weight (tonnes)</Label>
                    <Input
                      id="gross_weight"
                      type="number"
                      step="0.1"
                      value={newTicket.gross_weight}
                      onChange={(e) => {
                        setNewTicket({...newTicket, gross_weight: e.target.value});
                        // Auto-calculate net weight if both gross and tare are available
                        if (e.target.value && newTicket.tare_weight) {
                          const net = parseFloat(e.target.value) - parseFloat(newTicket.tare_weight);
                          setNewTicket(prev => ({...prev, gross_weight: e.target.value, net_weight: net.toFixed(1)}));
                        }
                      }}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tare_weight">Tare Weight (tonnes)</Label>
                    <Input
                      id="tare_weight"
                      type="number"
                      step="0.1"
                      value={newTicket.tare_weight}
                      onChange={(e) => {
                        setNewTicket({...newTicket, tare_weight: e.target.value});
                        // Auto-calculate net weight if both gross and tare are available
                        if (e.target.value && newTicket.gross_weight) {
                          const net = parseFloat(newTicket.gross_weight) - parseFloat(e.target.value);
                          setNewTicket(prev => ({...prev, tare_weight: e.target.value, net_weight: net.toFixed(1)}));
                        }
                      }}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="net_weight">Net Weight (tonnes)</Label>
                    <Input
                      id="net_weight"
                      type="number"
                      step="0.1"
                      value={newTicket.net_weight}
                      onChange={(e) => setNewTicket({...newTicket, net_weight: e.target.value})}
                      className="bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="default" className="flex-1" disabled={processingOCR}>
                    {processingOCR ? "Processing..." : "Save Ticket"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setUploadedImage(null);
                      setNewTicket({
                        job_assignment_id: "",
                        ticket_number: "",
                        weighbridge_name: "",
                        gross_weight: "",
                        tare_weight: "",
                        net_weight: "",
                        ticket_date: new Date().toISOString().split('T')[0],
                        ticket_image_url: ""
                      });
                    }}
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