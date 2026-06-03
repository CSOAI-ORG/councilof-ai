import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WasteProofData {
  erzeugerName: string;
  erzeugerAnschrift: string;
  erzeugerPlz: string;
  erzeugerOrt: string;
  abfallschluessel: string;
  abfallbezeichnung: string;
  menge: string;
  einheit: string;
  befoerdererName: string;
  befoerdererLizenz: string;
  entsorgungsanlage: string;
  entsorgungsart: string;
  datum: string;
  unterschrift: string;
}

const EWC_CODES_GERMAN = [
  { code: '170101', name: 'Beton' },
  { code: '170102', name: 'Ziegel' },
  { code: '170103', name: 'Fliesen, Ziegel und Keramik' },
  { code: '170107', name: 'Gemische aus Beton, Ziegeln, Fliesen und Keramik' },
  { code: '170201', name: 'Holz' },
  { code: '170202', name: 'Glas' },
  { code: '170203', name: 'Kunststoff' },
  { code: '170302', name: 'Bitumengemische' },
  { code: '170504', name: 'Boden und Steine' },
  { code: '170904', name: 'gemischte Bau- und Abbruchabfälle' },
];

const DISPOSAL_METHODS = [
  { code: 'R5', name: 'Verwertung/Rückgewinnung anderer anorganischer Stoffe' },
  { code: 'R12', name: 'Austausch von Abfällen zur Verwertung' },
  { code: 'R13', name: 'Ansammlung zur Verwertung' },
  { code: 'D1', name: 'Ablagerung auf Deponien' },
  { code: 'D5', name: 'Ablagerung in Deponien' },
];

export const GermanWasteProof: React.FC = () => {
  const [formData, setFormData] = useState<WasteProofData>({
    erzeugerName: '',
    erzeugerAnschrift: '',
    erzeugerPlz: '',
    erzeugerOrt: '',
    abfallschluessel: '',
    abfallbezeichnung: '',
    menge: '',
    einheit: 'Tonnen',
    befoerdererName: '',
    befoerdererLizenz: '',
    entsorgungsanlage: '',
    entsorgungsart: '',
    datum: new Date().toISOString().split('T')[0],
    unterschrift: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof WasteProofData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEwcSelect = (code: string) => {
    const ewc = EWC_CODES_GERMAN.find(e => e.code === code);
    if (ewc) {
      setFormData(prev => ({
        ...prev,
        abfallschluessel: code,
        abfallbezeichnung: ewc.name,
      }));
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // Validate required fields
    const requiredFields: (keyof WasteProofData)[] = [
      'erzeugerName', 'erzeugerAnschrift', 'abfallschluessel', 
      'menge', 'befoerdererName', 'entsorgungsanlage'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      setIsGenerating(false);
      return;
    }

    // Generate PDF content (simplified - in production use jsPDF or similar)
    const pdfContent = `
GEWERBEABFALLNACHWEIS
gemäß § 3 Gewerbeabfallverordnung (GewAbfV)

═══════════════════════════════════════════════════════════════

1. ABFALLERZEUGER
   Name/Firma: ${formData.erzeugerName}
   Anschrift: ${formData.erzeugerAnschrift}
   PLZ/Ort: ${formData.erzeugerPlz} ${formData.erzeugerOrt}

2. ABFALLART
   Abfallschlüssel (AVV): ${formData.abfallschluessel}
   Abfallbezeichnung: ${formData.abfallbezeichnung}
   Menge: ${formData.menge} ${formData.einheit}

3. BEFÖRDERER
   Name/Firma: ${formData.befoerdererName}
   Befördererlizenz-Nr.: ${formData.befoerdererLizenz}

4. ENTSORGUNG
   Entsorgungsanlage: ${formData.entsorgungsanlage}
   Entsorgungsart: ${formData.entsorgungsart}

5. DATUM UND UNTERSCHRIFT
   Datum: ${formData.datum}
   Unterschrift Erzeuger: ${formData.unterschrift}

═══════════════════════════════════════════════════════════════

Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.
Generiert am: ${new Date().toLocaleString('de-DE')}
Dokumenten-ID: GWN-${Date.now()}

Rechtlicher Hinweis: Der Abfallerzeuger bestätigt hiermit die 
Richtigkeit der gemachten Angaben gemäß GewAbfV.
    `.trim();

    // Create downloadable file
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gewerbeabfallnachweis_${formData.datum}_${formData.abfallschluessel}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Gewerbeabfallnachweis erfolgreich generiert');
    setIsGenerating(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-yellow-600" />
            <div>
              <CardTitle className="text-xl">Gewerbeabfallnachweis</CardTitle>
              <p className="text-sm text-muted-foreground">
                gemäß § 3 Gewerbeabfallverordnung (GewAbfV)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Deutschland
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Section 1: Waste Producer */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Abfallerzeuger
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="erzeugerName">Name/Firma *</Label>
              <Input
                id="erzeugerName"
                value={formData.erzeugerName}
                onChange={(e) => handleInputChange('erzeugerName', e.target.value)}
                placeholder="Musterfirma GmbH"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="erzeugerAnschrift">Anschrift *</Label>
              <Input
                id="erzeugerAnschrift"
                value={formData.erzeugerAnschrift}
                onChange={(e) => handleInputChange('erzeugerAnschrift', e.target.value)}
                placeholder="Musterstraße 123"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="erzeugerPlz">PLZ</Label>
              <Input
                id="erzeugerPlz"
                value={formData.erzeugerPlz}
                onChange={(e) => handleInputChange('erzeugerPlz', e.target.value)}
                placeholder="80331"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="erzeugerOrt">Ort</Label>
              <Input
                id="erzeugerOrt"
                value={formData.erzeugerOrt}
                onChange={(e) => handleInputChange('erzeugerOrt', e.target.value)}
                placeholder="München"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Waste Type */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Abfallart
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="abfallschluessel">Abfallschlüssel (AVV) *</Label>
              <Select onValueChange={handleEwcSelect} value={formData.abfallschluessel}>
                <SelectTrigger>
                  <SelectValue placeholder="Abfallschlüssel wählen" />
                </SelectTrigger>
                <SelectContent>
                  {EWC_CODES_GERMAN.map(ewc => (
                    <SelectItem key={ewc.code} value={ewc.code}>
                      {ewc.code} - {ewc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abfallbezeichnung">Abfallbezeichnung</Label>
              <Input
                id="abfallbezeichnung"
                value={formData.abfallbezeichnung}
                onChange={(e) => handleInputChange('abfallbezeichnung', e.target.value)}
                placeholder="Wird automatisch ausgefüllt"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="menge">Menge *</Label>
              <Input
                id="menge"
                type="number"
                value={formData.menge}
                onChange={(e) => handleInputChange('menge', e.target.value)}
                placeholder="z.B. 10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="einheit">Einheit</Label>
              <Select 
                onValueChange={(v) => handleInputChange('einheit', v)} 
                value={formData.einheit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tonnen">Tonnen</SelectItem>
                  <SelectItem value="Kubikmeter">Kubikmeter (m³)</SelectItem>
                  <SelectItem value="Kilogramm">Kilogramm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 3: Carrier */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
            Beförderer
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="befoerdererName">Name/Firma *</Label>
              <Input
                id="befoerdererName"
                value={formData.befoerdererName}
                onChange={(e) => handleInputChange('befoerdererName', e.target.value)}
                placeholder="Transport GmbH"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="befoerdererLizenz">Befördererlizenz-Nr.</Label>
              <Input
                id="befoerdererLizenz"
                value={formData.befoerdererLizenz}
                onChange={(e) => handleInputChange('befoerdererLizenz', e.target.value)}
                placeholder="z.B. BEF-12345"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Disposal */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
            Entsorgung
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entsorgungsanlage">Entsorgungsanlage *</Label>
              <Input
                id="entsorgungsanlage"
                value={formData.entsorgungsanlage}
                onChange={(e) => handleInputChange('entsorgungsanlage', e.target.value)}
                placeholder="Recyclinghof München"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entsorgungsart">Entsorgungsart</Label>
              <Select 
                onValueChange={(v) => handleInputChange('entsorgungsart', v)} 
                value={formData.entsorgungsart}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Entsorgungsart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSAL_METHODS.map(method => (
                    <SelectItem key={method.code} value={`${method.code} - ${method.name}`}>
                      {method.code} - {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 5: Date & Signature */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
            Datum und Unterschrift
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum</Label>
              <Input
                id="datum"
                type="date"
                value={formData.datum}
                onChange={(e) => handleInputChange('datum', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unterschrift">Unterschrift (Name)</Label>
              <Input
                id="unterschrift"
                value={formData.unterschrift}
                onChange={(e) => handleInputChange('unterschrift', e.target.value)}
                placeholder="Ihr vollständiger Name"
              />
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Rechtlicher Hinweis</p>
            <p>
              Dieses Dokument erfüllt die Anforderungen der Gewerbeabfallverordnung (GewAbfV). 
              Der Abfallerzeuger ist für die Richtigkeit aller Angaben verantwortlich. 
              Bei falschen Angaben drohen Bußgelder bis zu 100.000 €.
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setFormData({
            erzeugerName: '',
            erzeugerAnschrift: '',
            erzeugerPlz: '',
            erzeugerOrt: '',
            abfallschluessel: '',
            abfallbezeichnung: '',
            menge: '',
            einheit: 'Tonnen',
            befoerdererName: '',
            befoerdererLizenz: '',
            entsorgungsanlage: '',
            entsorgungsart: '',
            datum: new Date().toISOString().split('T')[0],
            unterschrift: '',
          })}>
            Zurücksetzen
          </Button>
          
          <Button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>Generiere...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Nachweis herunterladen
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GermanWasteProof;
