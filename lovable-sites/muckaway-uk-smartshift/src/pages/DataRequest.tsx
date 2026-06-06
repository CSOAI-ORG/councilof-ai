import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useGlobal } from '@/components/GlobalProvider';
import { getLegalEntityForRegion } from '@/config/legalConfig';
import { FileText, CheckCircle, Clock, Shield, Mail } from 'lucide-react';

const requestTypes = [
  { value: 'access', label: 'Access My Data (SAR)', description: 'Request a copy of all personal data we hold about you' },
  { value: 'deletion', label: 'Delete My Data', description: 'Request erasure of your personal data (Right to be Forgotten)' },
  { value: 'portability', label: 'Data Portability', description: 'Receive your data in a machine-readable format' },
  { value: 'rectification', label: 'Correct My Data', description: 'Request correction of inaccurate personal data' },
  { value: 'restriction', label: 'Restrict Processing', description: 'Limit how we use your personal data' },
  { value: 'objection', label: 'Object to Processing', description: 'Object to certain types of data processing' },
];

const formSchema = z.object({
  requestType: z.string().min(1, 'Please select a request type'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  accountEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  description: z.string().min(10, 'Please provide more details about your request').max(2000),
});

type FormData = z.infer<typeof formSchema>;

export default function DataRequest() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { region } = useGlobal();
  const legalEntity = getLegalEntityForRegion(region?.country || 'UK');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: '',
      fullName: '',
      email: '',
      accountEmail: '',
      description: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // In production, this would submit to an edge function that emails the DPO
      console.log('Data request submitted:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast({
        title: 'Request Submitted',
        description: 'Your data request has been received. We will respond within 30 days.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again or contact our Data Protection Officer directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Request Submitted Successfully</h1>
                <p className="text-muted-foreground mb-6">
                  Your data request has been received and logged. Our Data Protection Officer will review 
                  your request and respond within 30 days as required by applicable data protection law.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    What Happens Next?
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>1. We'll verify your identity using the information provided</li>
                    <li>2. Your request will be processed by our Data Protection Officer</li>
                    <li>3. You'll receive a response within 30 days (or notification of any extension)</li>
                    <li>4. If approved, we'll fulfill your request and confirm completion</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link to="/privacy">View Privacy Policy</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/">Return Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Subject Request</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Exercise your rights under GDPR, CCPA, and other applicable data protection laws. 
              Submit a request to access, correct, delete, or port your personal data.
            </p>
          </div>

          <Alert className="mb-8 bg-muted/50 border-border">
            <Shield className="h-4 w-4" />
            <AlertTitle>Your Privacy Rights</AlertTitle>
            <AlertDescription>
              Under applicable data protection laws, you have the right to access, correct, delete, 
              restrict, or port your personal data. We will respond to all valid requests within 30 days. 
              For more information, see our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </AlertDescription>
          </Alert>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Submit Your Request</CardTitle>
              <CardDescription>
                Please provide accurate information to help us process your request efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the type of request" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requestTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Legal Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormDescription>As it appears on your account</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormDescription>Where we'll send our response</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accountEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Email (if different)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="account@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The email address associated with your MuckAway.ai account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Details *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your request in detail. Include any specific data you're requesting, time periods, or other relevant information..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The more detail you provide, the faster we can process your request
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Data Protection Officer
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can also contact our DPO directly at:{' '}
                      <a href={`mailto:${legalEntity.dpo.email}`} className="text-primary hover:underline">
                        {legalEntity.dpo.email}
                      </a>
                      {legalEntity.dpo.phone && (
                        <> or {legalEntity.dpo.phone}</>
                      )}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" asChild>
                      <Link to="/privacy">Privacy Policy</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
