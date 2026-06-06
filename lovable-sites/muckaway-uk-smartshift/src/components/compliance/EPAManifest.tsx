import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface EPAManifestData {
  // Generator Information
  generatorName: string;
  generatorSiteAddress: string;
  generatorCity: string;
  generatorState: string;
  generatorZip: string;
  generatorEpaId: string;
  generatorPhone: string;
  emergencyPhone: string;
  
  // Transporter Information
  transporterName: string;
  transporterEpaId: string;
  dotNumber: string;
  
  // Waste Information
  wasteDescription: string;
  epaWasteCode: string;
  containerType: string;
  containerCount: string;
  totalQuantity: string;
  unitOfMeasure: string;
  hazardClass: string;
  
  // Destination Facility
  facilityName: string;
  facilityAddress: string;
  facilityCity: string;
  facilityState: string;
  facilityZip: string;
  facilityEpaId: string;
  
  // Certification
  generatorCertification: boolean;
  printedName: string;
  signatureDate: string;
}

const EPA_WASTE_CODES = [
  { code: 'D001', name: 'Ignitable Waste' },
  { code: 'D002', name: 'Corrosive Waste' },
  { code: 'D003', name: 'Reactive Waste' },
  { code: 'D004', name: 'Arsenic' },
  { code: 'D005', name: 'Barium' },
  { code: 'D006', name: 'Cadmium' },
  { code: 'D007', name: 'Chromium' },
  { code: 'D008', name: 'Lead' },
  { code: 'D009', name: 'Mercury' },
  { code: 'D018', name: 'Benzene' },
];

const CONTAINER_TYPES = [
  { code: 'DM', name: 'Metal Drums/Barrels/Kegs' },
  { code: 'DF', name: 'Fiberboard or Plastic Drums/Barrels/Kegs' },
  { code: 'TT', name: 'Cargo Tanks (Truck)' },
  { code: 'TC', name: 'Tank Cars' },
  { code: 'BA', name: 'Burlap, Cloth, Paper or Plastic Bags' },
  { code: 'CY', name: 'Cylinders' },
  { code: 'CM', name: 'Metal Boxes, Cartons, Cases' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const EPAManifest: React.FC = () => {
  const [formData, setFormData] = useState<EPAManifestData>({
    generatorName: '',
    generatorSiteAddress: '',
    generatorCity: '',
    generatorState: '',
    generatorZip: '',
    generatorEpaId: '',
    generatorPhone: '',
    emergencyPhone: '',
    transporterName: '',
    transporterEpaId: '',
    dotNumber: '',
    wasteDescription: '',
    epaWasteCode: '',
    containerType: '',
    containerCount: '',
    totalQuantity: '',
    unitOfMeasure: 'P',
    hazardClass: '',
    facilityName: '',
    facilityAddress: '',
    facilityCity: '',
    facilityState: '',
    facilityZip: '',
    facilityEpaId: '',
    generatorCertification: false,
    printedName: '',
    signatureDate: new Date().toISOString().split('T')[0],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const manifestNumber = `MAN-${Date.now().toString().slice(-9)}`;

  const handleInputChange = (field: keyof EPAManifestData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateManifest = async () => {
    setIsGenerating(true);
    
    // Validate required fields
    if (!formData.generatorCertification) {
      toast.error('You must certify the manifest before generating');
      setIsGenerating(false);
      return;
    }

    const requiredFields: (keyof EPAManifestData)[] = [
      'generatorName', 'generatorSiteAddress', 'generatorEpaId',
      'transporterName', 'wasteDescription', 'epaWasteCode',
      'facilityName', 'facilityEpaId', 'printedName'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please complete all required fields');
      setIsGenerating(false);
      return;
    }

    const manifestContent = `
═══════════════════════════════════════════════════════════════════════════════
                        UNIFORM HAZARDOUS WASTE MANIFEST
                              EPA Form 8700-22
═══════════════════════════════════════════════════════════════════════════════

MANIFEST TRACKING NUMBER: ${manifestNumber}

───────────────────────────────────────────────────────────────────────────────
1. GENERATOR'S INFORMATION
───────────────────────────────────────────────────────────────────────────────
   Name: ${formData.generatorName}
   Site Address: ${formData.generatorSiteAddress}
   City/State/ZIP: ${formData.generatorCity}, ${formData.generatorState} ${formData.generatorZip}
   EPA ID Number: ${formData.generatorEpaId}
   Phone: ${formData.generatorPhone}
   Emergency Phone: ${formData.emergencyPhone}

───────────────────────────────────────────────────────────────────────────────
2. TRANSPORTER INFORMATION
───────────────────────────────────────────────────────────────────────────────
   Company Name: ${formData.transporterName}
   EPA ID Number: ${formData.transporterEpaId}
   DOT Number: ${formData.dotNumber}

───────────────────────────────────────────────────────────────────────────────
3. DESIGNATED FACILITY
───────────────────────────────────────────────────────────────────────────────
   Facility Name: ${formData.facilityName}
   Address: ${formData.facilityAddress}
   City/State/ZIP: ${formData.facilityCity}, ${formData.facilityState} ${formData.facilityZip}
   EPA ID Number: ${formData.facilityEpaId}

───────────────────────────────────────────────────────────────────────────────
4. WASTE INFORMATION
───────────────────────────────────────────────────────────────────────────────
   Description: ${formData.wasteDescription}
   EPA Waste Code(s): ${formData.epaWasteCode}
   Container Type: ${formData.containerType}
   Number of Containers: ${formData.containerCount}
   Total Quantity: ${formData.totalQuantity} ${formData.unitOfMeasure === 'P' ? 'Pounds' : formData.unitOfMeasure === 'K' ? 'Kilograms' : 'Gallons'}
   DOT Hazard Class: ${formData.hazardClass || 'N/A'}

───────────────────────────────────────────────────────────────────────────────
5. GENERATOR'S CERTIFICATION
───────────────────────────────────────────────────────────────────────────────
   "I hereby declare that the contents of this consignment are fully and
   accurately described above by the proper shipping name, and are classified,
   packaged, marked and labeled/placarded, and are in all respects in proper
   condition for transport according to applicable international and national
   governmental regulations."

   Generator/Offeror Certification: ✓ CERTIFIED
   Printed/Typed Name: ${formData.printedName}
   Signature Date: ${formData.signatureDate}

═══════════════════════════════════════════════════════════════════════════════
                              TRACKING INFORMATION
═══════════════════════════════════════════════════════════════════════════════
   
   Document Generated: ${new Date().toLocaleString('en-US')}
   Manifest ID: ${manifestNumber}
   
   This manifest was generated electronically in compliance with 
   40 CFR 262.20 - The Manifest

   For EPA e-Manifest: https://e-manifest.epa.gov

═══════════════════════════════════════════════════════════════════════════════
    `.trim();

    // Create downloadable file
    const blob = new Blob([manifestContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EPA_Manifest_${manifestNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('EPA Manifest generated successfully');
    setIsGenerating(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-600/10 to-red-600/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-xl">EPA Uniform Hazardous Waste Manifest</CardTitle>
              <p className="text-sm text-muted-foreground">
                Form 8700-22 (Rev. 3-05)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            USA
          </Badge>
        </div>
        <p className="text-sm mt-2 font-mono bg-muted px-2 py-1 rounded w-fit">
          Manifest #: {manifestNumber}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Section 1: Generator Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Generator Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="generatorName">Generator Name *</Label>
              <Input
                id="generatorName"
                value={formData.generatorName}
                onChange={(e) => handleInputChange('generatorName', e.target.value)}
                placeholder="ABC Construction LLC"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="generatorSiteAddress">Site Address *</Label>
              <Input
                id="generatorSiteAddress"
                value={formData.generatorSiteAddress}
                onChange={(e) => handleInputChange('generatorSiteAddress', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generatorCity">City</Label>
              <Input
                id="generatorCity"
                value={formData.generatorCity}
                onChange={(e) => handleInputChange('generatorCity', e.target.value)}
                placeholder="Austin"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="generatorState">State</Label>
                <Select 
                  onValueChange={(v) => handleInputChange('generatorState', v)} 
                  value={formData.generatorState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="generatorZip">ZIP Code</Label>
                <Input
                  id="generatorZip"
                  value={formData.generatorZip}
                  onChange={(e) => handleInputChange('generatorZip', e.target.value)}
                  placeholder="78701"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generatorEpaId">EPA ID Number *</Label>
              <Input
                id="generatorEpaId"
                value={formData.generatorEpaId}
                onChange={(e) => handleInputChange('generatorEpaId', e.target.value)}
                placeholder="TXD123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generatorPhone">Phone</Label>
              <Input
                id="generatorPhone"
                value={formData.generatorPhone}
                onChange={(e) => handleInputChange('generatorPhone', e.target.value)}
                placeholder="(512) 555-0100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">24-Hour Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                placeholder="1-800-424-8802"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Transporter Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Transporter Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transporterName">Company Name *</Label>
              <Input
                id="transporterName"
                value={formData.transporterName}
                onChange={(e) => handleInputChange('transporterName', e.target.value)}
                placeholder="XYZ Hauling Inc"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transporterEpaId">EPA ID Number</Label>
              <Input
                id="transporterEpaId"
                value={formData.transporterEpaId}
                onChange={(e) => handleInputChange('transporterEpaId', e.target.value)}
                placeholder="TXD987654321"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dotNumber">DOT Number</Label>
              <Input
                id="dotNumber"
                value={formData.dotNumber}
                onChange={(e) => handleInputChange('dotNumber', e.target.value)}
                placeholder="1234567"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Waste Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
            Waste Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="wasteDescription">Waste Description *</Label>
              <Textarea
                id="wasteDescription"
                value={formData.wasteDescription}
                onChange={(e) => handleInputChange('wasteDescription', e.target.value)}
                placeholder="Describe the waste material..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="epaWasteCode">EPA Waste Code(s) *</Label>
              <Select 
                onValueChange={(v) => handleInputChange('epaWasteCode', v)} 
                value={formData.epaWasteCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select waste code" />
                </SelectTrigger>
                <SelectContent>
                  {EPA_WASTE_CODES.map(code => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.code} - {code.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="containerType">Container Type</Label>
              <Select 
                onValueChange={(v) => handleInputChange('containerType', v)} 
                value={formData.containerType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select container type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map(type => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.code} - {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="containerCount">Number of Containers</Label>
              <Input
                id="containerCount"
                type="number"
                value={formData.containerCount}
                onChange={(e) => handleInputChange('containerCount', e.target.value)}
                placeholder="1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="totalQuantity">Total Quantity</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) => handleInputChange('totalQuantity', e.target.value)}
                  placeholder="500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit</Label>
                <Select 
                  onValueChange={(v) => handleInputChange('unitOfMeasure', v)} 
                  value={formData.unitOfMeasure}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">Pounds (P)</SelectItem>
                    <SelectItem value="K">Kilograms (K)</SelectItem>
                    <SelectItem value="G">Gallons (G)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Designated Facility */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
            Designated Facility
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facilityName">Facility Name *</Label>
              <Input
                id="facilityName"
                value={formData.facilityName}
                onChange={(e) => handleInputChange('facilityName', e.target.value)}
                placeholder="Clean Earth Facility"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facilityEpaId">EPA ID Number *</Label>
              <Input
                id="facilityEpaId"
                value={formData.facilityEpaId}
                onChange={(e) => handleInputChange('facilityEpaId', e.target.value)}
                placeholder="TXD555555555"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="facilityAddress">Address</Label>
              <Input
                id="facilityAddress"
                value={formData.facilityAddress}
                onChange={(e) => handleInputChange('facilityAddress', e.target.value)}
                placeholder="456 Industrial Blvd"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facilityCity">City</Label>
              <Input
                id="facilityCity"
                value={formData.facilityCity}
                onChange={(e) => handleInputChange('facilityCity', e.target.value)}
                placeholder="Houston"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="facilityState">State</Label>
                <Select 
                  onValueChange={(v) => handleInputChange('facilityState', v)} 
                  value={formData.facilityState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facilityZip">ZIP Code</Label>
                <Input
                  id="facilityZip"
                  value={formData.facilityZip}
                  onChange={(e) => handleInputChange('facilityZip', e.target.value)}
                  placeholder="77001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Certification */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
            Generator Certification
          </h3>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <p className="text-sm">
              "I hereby declare that the contents of this consignment are fully and accurately 
              described above by the proper shipping name, and are classified, packaged, marked 
              and labeled/placarded, and are in all respects in proper condition for transport 
              according to applicable international and national governmental regulations."
            </p>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="generatorCertification" 
                checked={formData.generatorCertification}
                onCheckedChange={(checked) => handleInputChange('generatorCertification', checked as boolean)}
              />
              <Label htmlFor="generatorCertification" className="font-medium">
                I certify the above statement is true and correct *
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="printedName">Printed/Typed Name *</Label>
                <Input
                  id="printedName"
                  value={formData.printedName}
                  onChange={(e) => handleInputChange('printedName', e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signatureDate">Signature Date</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg flex items-start gap-3 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-200 mb-1">Federal Requirement</p>
            <p className="text-red-700 dark:text-red-300">
              Knowingly rendering, or causing to be rendered, any manifest entry materially false, 
              incomplete, or misleading may result in criminal penalties under 18 U.S.C. 1001.
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            onClick={generateManifest}
            disabled={isGenerating || !formData.generatorCertification}
            className="gap-2"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Manifest
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EPAManifest;
