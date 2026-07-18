/**
 * Bulk AI System Import
 * CSV/Excel upload with validation, duplicate detection, and automatic risk classification
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileText,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ValidationError[];
  duplicates: string[];
}

export default function BulkAISystemImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Get template and field descriptions
  const { data: template } = trpc.bulkImport.getCSVTemplate.useQuery();
  const { data: fieldInfo } = trpc.bulkImport.getFieldDescriptions.useQuery();

  // Import mutations
  const importCSV = trpc.bulkImport.importFromCSV.useMutation();
  const importExcel = trpc.bulkImport.importFromExcel.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.csv') && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls')) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      setFile(selectedFile);
      setResult(null);
      toast.success(`File "${selectedFile.name}" selected`);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const isCSV = file.name.endsWith('.csv');
      
      if (isCSV) {
        // Read CSV file as text
        const text = await file.text();
        const importResult = await importCSV.mutateAsync({ csvData: text });
        setResult(importResult);
        
        if (importResult.success) {
          toast.success(`Successfully imported ${importResult.imported} AI systems`);
        } else {
          toast.warning(`Import completed with ${importResult.errors.length} errors`);
        }
      } else {
        // Read Excel file as base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:... prefix
          
          const importResult = await importExcel.mutateAsync({ excelData: base64Data });
          setResult(importResult);
          
          if (importResult.success) {
            toast.success(`Successfully imported ${importResult.imported} AI systems`);
          } else {
            toast.warning(`Import completed with ${importResult.errors.length} errors`);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    if (template) {
      const blob = new Blob([template.template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    }
  };

  const getStatusIcon = (type: 'success' | 'error' | 'duplicate') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'duplicate':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk AI System Import</h1>
        <p className="text-gray-600 mt-1">
          Import multiple AI systems at once with automatic validation and risk classification
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">How to Use Bulk Import</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-900">
          <ol className="list-decimal list-inside space-y-2">
            <li>Download the CSV template below</li>
            <li>Fill in your AI system information (Name, Description, System Type, etc.)</li>
            <li>Upload the completed CSV or Excel file</li>
            <li>Review validation results and fix any errors</li>
            <li>Systems will be automatically imported with risk classification</li>
          </ol>
          <div className="flex items-start gap-2 mt-4 p-3 bg-blue-100 rounded">
            <AlertTriangle className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Duplicate systems (matching name) will be skipped automatically.
              Risk levels are auto-classified based on system type if not provided.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Field Descriptions */}
      {fieldInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Required Fields</CardTitle>
            <CardDescription>
              Field descriptions and validation rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {(Array.isArray(fieldInfo) ? fieldInfo : (fieldInfo as any).fields || []).map((field: any) => (
                <div key={field.name} className="p-3 border rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{field.name}</span>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                  <p className="text-xs text-gray-500">Example: {field.example}</p>
                  {field.options && (
                    <p className="text-xs text-gray-500 mt-1">
                      Options: {field.options.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Download Template</CardTitle>
            <CardDescription>
              Start with our pre-formatted CSV template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={downloadTemplate}
              disabled={!template}
            >
              <Download className="mr-2 h-5 w-5" />
              Download CSV Template
            </Button>
            <p className="text-sm text-gray-600 mt-3">
              The template includes all required fields and example data to help you get started.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Upload Your File</CardTitle>
            <CardDescription>
              CSV or Excel format supported
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="h-12 w-12 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">Click to upload</p>
                      <p className="text-sm text-gray-600">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV or Excel (max 10MB)</p>
                  </div>
                )}
              </label>
            </div>

            <Button
              className="w-full"
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>Processing...</>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Import Systems
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              Summary of the import operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Imported</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{result.imported}</p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Skipped</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{result.skipped}</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Errors</span>
                </div>
                <p className="text-2xl font-bold text-red-900">{result.errors.length}</p>
              </div>
            </div>

            {/* Duplicates */}
            {result.duplicates.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2">Duplicate Systems Skipped</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  {result.duplicates.map((name, idx) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Errors */}
            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
                <div className="space-y-2">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-800">
                      <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                      {error.value && <span className="text-red-600"> (value: {String(error.value)})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {result.success && result.imported > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-900">
                  ✅ Successfully imported {result.imported} AI system{result.imported !== 1 ? 's' : ''}.
                  You can view them in the AI Systems page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
