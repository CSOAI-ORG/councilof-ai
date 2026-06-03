import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReportGenerator } from '@/components/ReportGenerator';
import { ReportScheduler } from '@/components/ReportScheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock, History, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { format } from 'date-fns';

interface GeneratedReport {
  id: string;
  report_type: string;
  title: string;
  format: string;
  created_at: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  jobs: 'Jobs Report',
  revenue: 'Revenue Report',
  compliance: 'Compliance Report',
  environmental: 'Environmental Report',
  fleet: 'Fleet Report',
};

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  csv: <FileSpreadsheet className="h-4 w-4" />,
  json: <FileJson className="h-4 w-4" />,
};

export default function Reports() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate, schedule, and download business reports
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportGenerator />
              
              <Card>
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                  <CardDescription>
                    Quick access to common report configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Weekly Jobs Summary', type: 'jobs', period: 'Last 7 days' },
                    { name: 'Monthly Revenue', type: 'revenue', period: 'Last 30 days' },
                    { name: 'Quarterly Compliance', type: 'compliance', period: 'Last 90 days' },
                    { name: 'Annual Environmental', type: 'environmental', period: 'Last 365 days' },
                  ].map((template) => (
                    <div
                      key={template.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.period}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <ReportScheduler />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>
                  Your recently generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading reports...
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports generated yet. Create your first report above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {FORMAT_ICONS[report.format] || <FileText className="h-4 w-4" />}
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">
                                {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                              </Badge>
                              <span>{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
