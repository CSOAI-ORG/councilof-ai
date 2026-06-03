import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  RefreshCw, 
  Search,
  CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Record {
  id: string;
  [key: string]: any;
}

interface AnonymizationPreview {
  field: string;
  original: string;
  anonymized: string;
}

const ANONYMIZATION_TABLES = [
  { value: 'customers', label: 'Customers', piiFields: ['company_name', 'contact_name', 'email', 'phone', 'address', 'postcode'] },
  { value: 'jobs', label: 'Jobs', piiFields: ['site_address', 'site_postcode', 'notes'] },
  { value: 'quotes', label: 'Quotes', piiFields: ['site_postcode'] },
  { value: 'drivers', label: 'Drivers', piiFields: ['name', 'phone', 'licence_number'] },
];

export default function AnonymizationPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<Map<string, AnonymizationPreview[]>>(new Map());
  const [anonymizing, setAnonymizing] = useState(false);

  const tableConfig = ANONYMIZATION_TABLES.find(t => t.value === selectedTable);

  const searchRecords = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Required',
        description: 'Please enter a search term to find records.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      
      if (selectedTable === 'customers') {
        const { data: result } = await supabase
          .from('customers')
          .select('*')
          .eq('anonymized', false)
          .or(`company_name.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(50);
        data = result || [];
      } else if (selectedTable === 'jobs') {
        const { data: result } = await supabase
          .from('jobs')
          .select('*')
          .eq('anonymized', false)
          .or(`site_address.ilike.%${searchQuery}%,site_postcode.ilike.%${searchQuery}%`)
          .limit(50);
        data = result || [];
      } else if (selectedTable === 'drivers') {
        const { data: result } = await supabase
          .from('drivers')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .limit(50);
        data = result || [];
      }

      setRecords(data);
      setSelectedRecords([]);
      setPreview(new Map());
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (selectedRecords.length === 0) {
      toast({
        title: 'No Records Selected',
        description: 'Please select at least one record to preview anonymization.',
        variant: 'destructive',
      });
      return;
    }

    setPreviewing(true);
    const newPreview = new Map<string, AnonymizationPreview[]>();

    for (const recordId of selectedRecords) {
      const record = records.find(r => r.id === recordId);
      if (!record || !tableConfig) continue;

      const previews: AnonymizationPreview[] = [];

      for (const field of tableConfig.piiFields) {
        if (record[field]) {
          previews.push({
            field,
            original: String(record[field]),
            anonymized: anonymizeValue(field, record[field])
          });
        }
      }

      newPreview.set(recordId, previews);
    }

    setPreview(newPreview);
    setPreviewing(false);
  };

  const anonymizeValue = (field: string, value: any): string => {
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase();

    switch (field) {
      case 'company_name':
      case 'contact_name':
      case 'name':
        return `Anonymized_${hash}`;
      case 'email':
        return `redacted_${hash}@anonymized.local`;
      case 'phone':
        return '[REDACTED]';
      case 'address':
      case 'site_address':
        return '[Address Redacted]';
      case 'postcode':
      case 'site_postcode':
        // Keep outward code only (e.g., SW1 from SW1A 2AA)
        const parts = String(value).split(' ');
        return parts[0] ? `${parts[0]} ***` : '[REDACTED]';
      case 'licence_number':
        return `****${hash}`;
      case 'notes':
        return '[Notes Redacted]';
      default:
        return '[REDACTED]';
    }
  };

  const performAnonymization = async () => {
    if (selectedRecords.length === 0) return;

    setAnonymizing(true);
    try {
      for (const recordId of selectedRecords) {
        const record = records.find(r => r.id === recordId);
        if (!record || !tableConfig) continue;

        const updates: { [key: string]: any } = { anonymized: true };

        for (const field of tableConfig.piiFields) {
          if (record[field]) {
            updates[field] = anonymizeValue(field, record[field]);
          }
        }

        if (selectedTable === 'customers') {
          await supabase.from('customers').update(updates).eq('id', recordId);
        } else if (selectedTable === 'jobs') {
          await supabase.from('jobs').update(updates).eq('id', recordId);
        } else if (selectedTable === 'drivers') {
          await supabase.from('drivers').update(updates).eq('id', recordId);
        }
      }

      // Log to audit
      await supabase.from('data_access_audit').insert({
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        action_type: 'anonymization',
        resource_type: selectedTable,
        resource_details: {
          record_ids: selectedRecords,
          anonymized_at: new Date().toISOString()
        }
      });

      toast({
        title: 'Anonymization Complete',
        description: `${selectedRecords.length} records have been anonymized.`,
      });

      // Refresh the search
      setRecords(records.filter(r => !selectedRecords.includes(r.id)));
      setSelectedRecords([]);
      setPreview(new Map());
    } catch (error: any) {
      toast({
        title: 'Anonymization Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnonymizing(false);
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const selectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Data Anonymization
          </CardTitle>
          <CardDescription>
            Permanently anonymize personal data in selected records. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Irreversible Action</AlertTitle>
            <AlertDescription>
              Anonymization permanently replaces personal data with pseudonyms. The original data cannot be recovered.
              Use this feature for GDPR compliance, creating demo data, or removing PII from old records.
            </AlertDescription>
          </Alert>

          {/* Search Controls */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Data Type</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANONYMIZATION_TABLES.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2]">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRecords()}
                />
                <Button onClick={searchRecords} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* PII Fields Info */}
          {tableConfig && (
            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-sm">Fields that will be anonymized:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tableConfig.piiFields.map(field => (
                  <Badge key={field} variant="outline" className="capitalize">
                    {field.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Records Table */}
          {records.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRecords.length === records.length}
                    onCheckedChange={selectAll}
                  />
                  <Label>Select All ({records.length} records)</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generatePreview}
                    disabled={selectedRecords.length === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={performAnonymization}
                    disabled={selectedRecords.length === 0 || anonymizing}
                  >
                    {anonymizing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    Anonymize ({selectedRecords.length})
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>ID</TableHead>
                    {tableConfig?.piiFields.slice(0, 3).map(field => (
                      <TableHead key={field} className="capitalize">{field.replace('_', ' ')}</TableHead>
                    ))}
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() => toggleRecordSelection(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {record.id.slice(0, 8)}...
                      </TableCell>
                      {tableConfig?.piiFields.slice(0, 3).map(field => (
                        <TableCell key={field} className="max-w-[150px] truncate">
                          {record[field] || '-'}
                        </TableCell>
                      ))}
                      <TableCell>
                        {preview.has(record.id) && (
                          <Badge className="bg-green-500/10 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Preview Panel */}
          {preview.size > 0 && (
            <Card className="bg-muted/30 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Anonymization Preview</CardTitle>
                <CardDescription>
                  Review the changes before applying anonymization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(preview.entries()).map(([recordId, changes]) => (
                    <div key={recordId} className="border border-border rounded-lg p-4">
                      <div className="text-sm font-mono text-muted-foreground mb-2">
                        Record: {recordId.slice(0, 8)}...
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Original</TableHead>
                            <TableHead>Anonymized</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {changes.map((change, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="capitalize font-medium">
                                {change.field.replace('_', ' ')}
                              </TableCell>
                              <TableCell className="text-red-500 line-through">
                                {change.original}
                              </TableCell>
                              <TableCell className="text-green-500">
                                {change.anonymized}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {records.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Search for records to anonymize</p>
              <p className="text-sm">Enter a name, email, or address to find matching records</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
