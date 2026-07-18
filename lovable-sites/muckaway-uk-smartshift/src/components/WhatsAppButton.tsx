import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

interface WhatsAppButtonProps {
  jobId?: string;
  customerName?: string;
  bookingReference?: string;
  collectionDate?: string;
  materialType?: string;
  variant?: 'button' | 'optin';
}

export const WhatsAppButton = ({
  jobId,
  customerName = 'Customer',
  bookingReference,
  collectionDate,
  materialType,
  variant = 'button'
}: WhatsAppButtonProps) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const sendWhatsAppNotification = async () => {
    if (!phoneNumber) {
      setShowPhoneInput(true);
      return;
    }

    setSending(true);
    
    trackEvent('whatsapp_notification_requested', {
      job_id: jobId,
      message_type: 'booking_confirmation'
    });

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-notification', {
        body: {
          to: phoneNumber,
          type: 'booking_confirmation',
          data: {
            customerName,
            bookingReference: bookingReference || jobId,
            collectionDate: collectionDate || 'To be confirmed',
            materialType: materialType || 'Spoil'
          }
        }
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'WhatsApp notification sent!',
        description: 'You\'ll receive booking updates on WhatsApp.',
      });

      trackEvent('whatsapp_notification_sent', {
        job_id: jobId,
        success: true
      });
    } catch (error) {
      console.error('WhatsApp error:', error);
      toast({
        title: 'Unable to send WhatsApp',
        description: 'Please try again or check your phone number.',
        variant: 'destructive'
      });

      trackEvent('whatsapp_notification_error', {
        job_id: jobId,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSending(false);
    }
  };

  if (variant === 'optin') {
    return (
      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="whatsapp-optin" 
            checked={optedIn}
            onCheckedChange={(checked) => {
              setOptedIn(checked as boolean);
              if (checked) setShowPhoneInput(true);
            }}
          />
          <div className="space-y-1">
            <Label htmlFor="whatsapp-optin" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              Get WhatsApp updates
            </Label>
            <p className="text-xs text-muted-foreground">
              Receive booking confirmations, driver arrival alerts, and collection updates
            </p>
          </div>
        </div>
        
        {showPhoneInput && optedIn && (
          <div className="ml-6 space-y-2">
            <Input
              type="tel"
              placeholder="+44 7700 900000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              size="sm" 
              onClick={sendWhatsAppNotification}
              disabled={sending || sent || !phoneNumber}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Subscribed!
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Subscribe
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showPhoneInput && !sent && (
        <Input
          type="tel"
          placeholder="+44 7700 900000"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="max-w-xs"
        />
      )}
      <Button
        variant="outline"
        onClick={sendWhatsAppNotification}
        disabled={sending || sent}
        className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : sent ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            WhatsApp Sent!
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Get WhatsApp Updates
          </>
        )}
      </Button>
    </div>
  );
};

export default WhatsAppButton;
