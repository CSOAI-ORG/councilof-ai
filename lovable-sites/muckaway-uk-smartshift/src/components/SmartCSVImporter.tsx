import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileSpreadsheet, 
  Brain, 
  Check, 
  AlertCircle, 
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Settings,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface SmartCSVImporterProps {
  onClose: () => void;
}

interface FieldMapping {
  sourceField: string;
  ourField: string;
  confidence: number;
  accepted: boolean;
}

export function SmartCSVImporter({ onClose }: SmartCSVImporterProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    detectedType: string;
    columns: number;
    rows: number;
    confidence: number;
    fieldMappings: FieldMapping[];
  } | null>(null);
  const [importSettings, setImportSettings] = useState({
    mode: 'create_only',
    conflictResolution: 'skip',
    dryRun: true,
  });
  const [isImporting, setIsImporting] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a CSV or Excel file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  const analyzeFile = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis result
    setAnalysisResult({
      detectedType: 'Customer Database',
      columns: 12,
      rows: 247,
      confidence: 96,
      fieldMappings: [
        { sourceField: 'ClientName', ourField: 'Customer Name', confidence: 98, accepted: true },
        { sourceField: 'Email', ourField: 'Email', confidence: 99, accepted: true },
        { sourceField: 'Phone', ourField: 'Phone', confidence: 99, accepted: true },
        { sourceField: 'Address', ourField: 'Site Address', confidence: 92, accepted: true },
        { sourceField: 'PostCode', ourField: 'Postcode', confidence: 97, accepted: true },
        { sourceField: 'CompanyName', ourField: 'Company Name', confidence: 95, accepted: true },
        { sourceField: 'PaymentTerms', ourField: 'Payment Terms', confidence: 88, accepted: true },
        { sourceField: 'CreditLimit', ourField: 'Credit Limit', confidence: 91, accepted: true },
      ],
    });
    
    setIsAnalyzing(false);
    setStep(2);
  };

  const toggleFieldAccepted = (index: number) => {
    if (!analysisResult) return;
    const newMappings = [...analysisResult.fieldMappings];
    newMappings[index].accepted = !newMappings[index].accepted;
    setAnalysisResult({ ...analysisResult, fieldMappings: newMappings });
  };

  const startImport = async () => {
    setIsImporting(true);
    // Simulate import process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsImporting(false);
    
    if (importSettings.dryRun) {
      toast.success('Dry run completed', {
        description: 'Preview successful. Disable dry run to import data.'
      });
    } else {
      toast.success('Import completed', {
        description: `${analysisResult?.rows} records imported successfully`
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background border rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Smart CSV Importer</h2>
            <p className="text-sm text-muted-foreground">AI-powered data import</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-medium">Upload</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="font-medium">Map Fields</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 3 ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <span className="font-medium">Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                4
              </div>
              <span className="font-medium">Import</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="max-w-xl mx-auto">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <FileSpreadsheet className="w-16 h-16 mx-auto text-primary" />
                    <div>
                      <p className="font-semibold text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setFile(null)}>
                        Choose Different File
                      </Button>
                      <Button onClick={analyzeFile} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">
                      Drag and drop your CSV or Excel file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or
                    </p>
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls,.ods"
                        onChange={handleFileSelect}
                      />
                      <Button variant="outline" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Supported: .csv, .xlsx, .xls, .ods (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 2 && analysisResult && (
            <div className="max-w-3xl mx-auto">
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold">AI Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Detected: <strong>{analysisResult.detectedType}</strong> • 
                        {analysisResult.columns} columns • 
                        {analysisResult.rows} rows • 
                        {analysisResult.confidence}% confidence
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Field Mappings</CardTitle>
                      <CardDescription>Review and adjust AI suggestions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (analysisResult) {
                        const allAccepted = analysisResult.fieldMappings.every(f => f.accepted);
                        setAnalysisResult({
                          ...analysisResult,
                          fieldMappings: analysisResult.fieldMappings.map(f => ({ ...f, accepted: !allAccepted }))
                        });
                      }
                    }}>
                      {analysisResult?.fieldMappings.every(f => f.accepted) ? 'Deselect All' : 'Accept All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                      <div className="col-span-1"></div>
                      <div className="col-span-4">Your Field</div>
                      <div className="col-span-4">Our Field</div>
                      <div className="col-span-2">Confidence</div>
                      <div className="col-span-1"></div>
                    </div>
                    {analysisResult.fieldMappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center py-2">
                        <div className="col-span-1">
                          <Checkbox 
                            checked={mapping.accepted}
                            onCheckedChange={() => toggleFieldAccepted(index)}
                          />
                        </div>
                        <div className="col-span-4">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{mapping.sourceField}</code>
                        </div>
                        <div className="col-span-4">
                          <span className="font-medium">{mapping.ourField}</span>
                        </div>
                        <div className="col-span-2">
                          <Badge variant={mapping.confidence >= 90 ? 'default' : 'secondary'}>
                            {mapping.confidence}%
                          </Badge>
                        </div>
                        <div className="col-span-1">
                          {mapping.confidence >= 90 ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Import Settings */}
          {step === 3 && (
            <div className="max-w-xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={importSettings.mode} 
                    onValueChange={(value) => setImportSettings({ ...importSettings, mode: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create_only" id="create_only" />
                      <Label htmlFor="create_only">Create new records only (skip duplicates)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update" id="update" />
                      <Label htmlFor="update">Update existing records with new data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merge" id="merge" />
                      <Label htmlFor="merge">Merge data (combine existing + new)</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conflict Resolution</CardTitle>
                  <CardDescription>If a record exists with the same email/ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={importSettings.conflictResolution} 
                    onValueChange={(value) => setImportSettings({ ...importSettings, conflictResolution: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip">Keep existing (skip duplicate)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="overwrite" id="overwrite" />
                      <Label htmlFor="overwrite">Overwrite with new data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="duplicate" id="duplicate" />
                      <Label htmlFor="duplicate">Create duplicate record</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="dryRun" 
                      checked={importSettings.dryRun}
                      onCheckedChange={(checked) => setImportSettings({ ...importSettings, dryRun: checked as boolean })}
                    />
                    <Label htmlFor="dryRun" className="font-medium">
                      Dry run (preview without importing)
                    </Label>
                    <Badge variant="outline" className="ml-2">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-6">
                    Preview import results before making changes to your data
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Preview & Import */}
          {step === 4 && analysisResult && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Import</CardTitle>
                  <CardDescription>Review your import settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">File</p>
                      <p className="font-medium">{file?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Records</p>
                      <p className="font-medium">{analysisResult.rows} rows</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fields Mapped</p>
                      <p className="font-medium">
                        {analysisResult.fieldMappings.filter(f => f.accepted).length} / {analysisResult.fieldMappings.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mode</p>
                      <p className="font-medium capitalize">{importSettings.mode.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {importSettings.dryRun && (
                    <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                      <Eye className="w-5 h-5 text-primary" />
                      <p className="text-sm">
                        <strong>Dry run enabled.</strong> No data will be imported. 
                        You'll see a preview of what would be imported.
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <p className="text-sm font-medium mb-2">Preview (first 5 records):</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {analysisResult.fieldMappings
                              .filter(f => f.accepted)
                              .slice(0, 5)
                              .map(f => (
                                <th key={f.ourField} className="text-left p-2 font-medium">{f.ourField}</th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Demo preview rows */}
                          <tr className="border-b">
                            <td className="p-2">ABC Construction</td>
                            <td className="p-2">john@abc.co.uk</td>
                            <td className="p-2">07700 900123</td>
                            <td className="p-2">123 Main St</td>
                            <td className="p-2">SW1A 1AA</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">SiteWorks Ltd</td>
                            <td className="p-2">info@siteworks.com</td>
                            <td className="p-2">07700 900456</td>
                            <td className="p-2">456 High St</td>
                            <td className="p-2">EC1A 1BB</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground flex-1 ml-3">
                  This will not overwrite existing data unless you selected that option. 
                  Duplicates will be handled based on your conflict resolution settings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </>
            )}
          </Button>
          
          {step < 4 && step > 1 && (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {step === 4 && (
            <Button onClick={startImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {importSettings.dryRun ? 'Running Preview...' : 'Importing...'}
                </>
              ) : (
                <>
                  {importSettings.dryRun ? 'Run Preview' : 'Start Import'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
