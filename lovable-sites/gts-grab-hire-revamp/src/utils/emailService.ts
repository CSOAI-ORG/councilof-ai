// Email service utility for form submissions
export interface FormSubmission {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  service?: string;
  location?: string;
  timeline?: string;
  projectDetails?: string;
  formType: 'contact' | 'quote' | 'newsletter' | 'muck-away-quote' | 'aggregates-quote';
}

export const submitForm = async (data: FormSubmission): Promise<{ success: boolean; message: string }> => {
  try {
    // In a real implementation, this would send to your email service
    // For now, we'll simulate form submission and show success
    console.log('Form submission data:', data);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create formatted email content
    const emailContent = formatEmailContent(data);
    
    // Log the formatted email for demonstration
    console.log('Email content that would be sent to contact@gtsgrabhire.co.uk:', emailContent);
    
    return {
      success: true,
      message: data.formType.includes('quote') 
        ? 'Your quote request has been sent successfully! We will contact you within 2 hours with exact pricing and availability.'
        : 'Your message has been sent successfully! We will get back to you within 24 hours.'
    };
  } catch (error) {
    console.error('Form submission error:', error);
    return {
      success: false,
      message: 'There was an error sending your message. Please try calling us directly at 07958 710 548.'
    };
  }
};

const formatEmailContent = (data: FormSubmission): string => {
  const isCalculatorQuote = data.formType.includes('quote');
  let content = `New ${data.formType.toUpperCase().replace('-', ' ')} Form Submission from GTS GrabHire Website\n\n`;
  
  content += `Name: ${data.name}\n`;
  content += `Email: ${data.email}\n`;
  if (data.phone) content += `Phone: ${data.phone}\n`;
  if (data.subject) content += `Subject: ${data.subject}\n`;
  if (data.service) content += `Service: ${data.service}\n`;
  if (data.location) content += `Location: ${data.location}\n`;
  if (data.timeline) content += `Timeline: ${data.timeline}\n`;
  
  content += `\nMessage:\n${data.message}\n`;
  
  if (data.projectDetails && isCalculatorQuote) {
    content += `\nCalculator Data:\n${data.projectDetails}\n`;
  } else if (data.projectDetails) {
    content += `\nProject Details:\n${data.projectDetails}\n`;
  }
  
  content += `\nSubmitted: ${new Date().toLocaleString()}\n`;
  content += `Form Type: ${data.formType}\n`;
  content += `Email Destination: contact@gtsgrabhire.co.uk\n`;
  
  if (isCalculatorQuote) {
    content += `\nPRIORITY: CALCULATOR QUOTE REQUEST - Response needed within 2 hours\n`;
  }
  
  return content;
};

// Newsletter signup utility
export const subscribeToNewsletter = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Newsletter subscription for:', email);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Successfully subscribed to our newsletter!'
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: 'There was an error subscribing to our newsletter. Please try again.'
    };
  }
};