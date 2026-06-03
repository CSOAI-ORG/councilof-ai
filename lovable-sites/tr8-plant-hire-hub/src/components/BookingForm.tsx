import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { equipmentList } from "@/data/equipment";
import { toast } from "@/hooks/use-toast";

interface BookingFormProps {
  preselectedEquipment?: string;
}

const BookingForm = ({ preselectedEquipment }: BookingFormProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState(preselectedEquipment || "");
  const [hireDuration, setHireDuration] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [withOperator, setWithOperator] = useState(false);
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const handleWhatsAppSubmit = () => {
    if (!selectedEquipment || !name || !phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least equipment, name, and phone number.",
        variant: "destructive",
      });
      return;
    }

    const equipment = equipmentList.find((e) => e.id === selectedEquipment);
    
    const message = `🚜 *TR8 PLANT HIRE BOOKING REQUEST*

*Equipment:* ${equipment?.name || selectedEquipment}
*Duration:* ${hireDuration || "Not specified"}
*Start Date:* ${startDate ? format(startDate, "PPP") : "Not specified"}
*End Date:* ${endDate ? format(endDate, "PPP") : "Not specified"}
*With Operator:* ${withOperator ? "Yes" : "No"}
*Delivery Required:* ${deliveryRequired ? "Yes" : "No"}

*Customer Details:*
Name: ${name}
Phone: ${phone}
Email: ${email || "Not provided"}
Site Address: ${siteAddress || "Not provided"}

*Project Description:*
${projectDescription || "Not provided"}`;

    const whatsappUrl = `https://wa.me/447746159640?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Opening WhatsApp",
      description: "Complete your booking request in WhatsApp.",
    });
  };

  return (
    <div className="card-industrial p-6 md:p-8 space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">
          Book Equipment
        </h3>
        <p className="text-muted-foreground">
          Fill in your requirements and we'll get back to you ASAP
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Equipment Selection */}
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipment Type *</Label>
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipmentList.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hire Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Hire Duration</Label>
          <Select value={hireDuration} onValueChange={setHireDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekend">Weekend (Fri-Mon)</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="long-term">Long Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => date < (startDate || new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* With Operator Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="operator">With Operator?</Label>
            <p className="text-sm text-muted-foreground">
              Experienced CPCS operators available
            </p>
          </div>
          <Switch
            id="operator"
            checked={withOperator}
            onCheckedChange={setWithOperator}
          />
        </div>

        {/* Delivery Required Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="delivery">Delivery Required?</Label>
            <p className="text-sm text-muted-foreground">
              We deliver across Hampshire & Surrey
            </p>
          </div>
          <Switch
            id="delivery"
            checked={deliveryRequired}
            onCheckedChange={setDeliveryRequired}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6 mt-6">
        <h4 className="font-display font-bold text-foreground mb-4">Your Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxx xxx xxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Site Address</Label>
            <Input
              id="address"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="Where do you need the equipment?"
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Tell us about your project..."
            rows={4}
          />
        </div>
      </div>

      <Button
        onClick={handleWhatsAppSubmit}
        variant="hero"
        size="lg"
        className="w-full mt-6"
      >
        📱 Send Booking Request via WhatsApp
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Or call us directly: <a href="tel:07746159640" className="text-primary font-bold">07746 159 640</a>
      </p>
    </div>
  );
};

export default BookingForm;
