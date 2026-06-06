import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { value: 'jobs', label: 'Jobs Report', description: 'All job details, status, and revenue' },
  { value: 'revenue', label: 'Revenue Report', description: 'Financial summary and trends' },
  { value: 'compliance', label: 'Compliance Report', description: 'Waste transfer notes and certificates' },
  { value: 'environmental', label: 'Environmental Report', description: 'CO2 savings and recycling metrics' },
  { value: 'fleet', label: 'Fleet Report', description: 'Vehicle utilization and maintenance' },
];

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'csv', label: 'Excel (CSV)' },
  { value: 'json', label: 'JSON Data' },
];

export function ReportGenerator() {
  const [reportType, setReportType] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!reportType || !dateFrom || !dateTo) {
      toast({
        title: 'Missing Information',
        description: 'Please select report type and date range',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Save report record
      const { data: report, error } = await supabase
        .from('generated_reports')
        .insert({
          user_id: session.user.id,
          report_type: reportType,
          title: `${REPORT_TYPES.find(r => r.value === reportType)?.label} - ${format(dateFrom, 'MMM d')} to ${format(dateTo, 'MMM d, yyyy')}`,
          date_range_start: format(dateFrom, 'yyyy-MM-dd'),
          date_range_end: format(dateTo, 'yyyy-MM-dd'),
          format: exportFormat,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate CSV data based on report type
      let csvData = '';
      
      if (reportType === 'jobs') {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .gte('created_at', dateFrom.toISOString())
          .lte('created_at', dateTo.toISOString());
        
        if (jobs && jobs.length > 0) {
          const headers = Object.keys(jobs[0]).join(',');
          const rows = jobs.map(job => Object.values(job).map(v => `"${v}"`).join(',')).join('\n');
          csvData = `${headers}\n${rows}`;
        }
      }

      // Download file
      if (exportFormat === 'csv' && csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Report Generated',
        description: 'Your report has been created successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Report
        </CardTitle>
        <CardDescription>
          Create custom reports with your preferred date range and format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !reportType}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
