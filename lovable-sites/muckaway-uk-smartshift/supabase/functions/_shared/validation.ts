// Shared validation schemas for edge functions
// Using Zod for runtime type checking and validation

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============= Common Validators =============

export const emailSchema = z.string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email too long")
  .email("Invalid email format");

export const phoneSchema = z.string()
  .trim()
  .min(8, "Phone number too short")
  .max(20, "Phone number too long")
  .regex(/^[\d+\s\-()]+$/, "Invalid phone number format");

export const uuidSchema = z.string()
  .uuid("Invalid UUID format");

export const sanitizedStringSchema = (maxLength: number = 1000) => 
  z.string()
    .trim()
    .max(maxLength, `String exceeds ${maxLength} characters`)
    .transform(val => val.replace(/<[^>]*>/g, '')); // Strip HTML tags

export const postcodeSchema = z.string()
  .trim()
  .min(3, "Postcode too short")
  .max(15, "Postcode too long")
  .regex(/^[A-Za-z0-9\s\-]+$/, "Invalid postcode format");

// ============= AI Chatbot Schemas =============

export const chatMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message too long (max 2000 characters)")
    .transform(val => val.replace(/<script[^>]*>.*?<\/script>/gi, '')), // Remove script tags
  context: z.string()
    .max(500, "Context too long")
    .optional()
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// ============= Notification Schemas =============

export const notificationTypeSchema = z.enum([
  'welcome',
  'usage_warning', 
  'renewal_reminder',
  'job_complete',
  'visual_test_failure'
]);

export const sendNotificationSchema = z.object({
  user_id: uuidSchema.optional(),
  email: emailSchema,
  type: notificationTypeSchema,
  data: z.record(z.unknown()).optional()
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

// ============= WhatsApp Schemas =============

export const whatsappTypeSchema = z.enum([
  'booking_confirmation',
  'collection_reminder',
  'driver_arrival',
  'job_complete',
  'custom'
]);

export const whatsappMetadataSchema = z.object({
  jobId: z.string().max(100).optional(),
  customerName: sanitizedStringSchema(100).optional(),
  collectionDate: z.string().max(50).optional(),
  driverName: sanitizedStringSchema(100).optional(),
  vehicleReg: z.string().max(20).optional(),
  address: sanitizedStringSchema(200).optional()
}).optional();

export const whatsappMessageSchema = z.object({
  to: phoneSchema,
  templateName: z.string().max(100).optional(),
  templateLanguage: z.string().max(10).optional(),
  templateParams: z.array(z.string().max(200)).max(10).optional(),
  message: sanitizedStringSchema(1000).optional(),
  type: whatsappTypeSchema,
  metadata: whatsappMetadataSchema
});

export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>;

// ============= Checkout Schemas =============

export const currencySchema = z.enum([
  'gbp', 'usd', 'eur', 'cad', 'aud', 'nzd', 'brl', 'inr', 'sgd', 'aed', 'zar',
  'myr', 'idr', 'php', 'thb', 'vnd', 'sar'
]).transform(val => val.toLowerCase());

export const checkoutModeSchema = z.enum(['payment', 'subscription']);

export const jobDataSchema = z.object({
  materialType: sanitizedStringSchema(100).optional(),
  postcode: postcodeSchema.optional(),
  volume: z.number().positive().max(100000).optional(),
  customer: sanitizedStringSchema(100).optional()
}).optional();

export const createCheckoutSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .max(1000000, "Amount exceeds maximum")
    .optional(),
  currency: currencySchema.default('gbp'),
  mode: checkoutModeSchema.default('payment'),
  priceId: z.string()
    .regex(/^price_/, "Invalid priceId format")
    .optional(),
  jobData: jobDataSchema,
  metadata: z.record(z.string().max(500)).optional()
}).refine(
  data => data.priceId || data.amount,
  { message: "Either priceId or amount is required" }
);

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// ============= Quote Schemas =============

export const materialTypeSchema = z.string()
  .trim()
  .min(1, "Material type is required")
  .max(100, "Material type too long");

export const quoteRequestSchema = z.object({
  material_type: materialTypeSchema,
  volume_tonnes: z.number()
    .positive("Volume must be positive")
    .max(100000, "Volume exceeds maximum"),
  site_postcode: postcodeSchema.optional(),
  contamination_level: z.enum(['none', 'low', 'medium', 'high']).optional(),
  ewc_code: z.string().max(20).optional(),
  source: z.string().max(50).optional()
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

// ============= Spoil Classification Schemas =============

export const spoilClassificationSchema = z.object({
  image: z.string()
    .min(1, "Image data is required")
    .max(10000000, "Image too large"), // ~7.5MB base64
  imageUrl: z.string().url().optional()
}).refine(
  data => data.image || data.imageUrl,
  { message: "Either image or imageUrl is required" }
);

export type SpoilClassificationInput = z.infer<typeof spoilClassificationSchema>;

// ============= Helper Functions =============

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errorMessage = result.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  
  return { success: false, error: errorMessage };
}

export function createValidationErrorResponse(
  error: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: `Validation error: ${error}` }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
