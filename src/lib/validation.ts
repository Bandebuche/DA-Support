import { z } from 'zod';

// Indian Mobile Number Regex: 10 digits starting with 6-9
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const ticketStep1Schema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(80, { message: 'Full name cannot exceed 80 characters.' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .toLowerCase()
    .trim(),
  mobile: z
    .string()
    .regex(INDIAN_MOBILE_REGEX, { message: 'Enter a valid 10-digit Indian WhatsApp mobile number.' }),
  userType: z.enum(['Student Pro', 'Franchise Hub'], {
    required_error: 'Please select your user type.',
  }),
  membershipTier: z.enum(['Diamond Elite', 'Silver Pass', 'Other / Not Specified'], {
    required_error: 'Please select your membership tier.',
  }),
});

export const ticketStep2Schema = z.object({
  ecosystem: z.enum(['Chakravyuh CRM', 'Digital Azadi Hub', 'WordPress & Hosting', 'Other'], {
    required_error: 'Please select product ecosystem.',
  }),
  category: z.string().min(2, { message: 'Please select an issue category.' }),
  websiteUrl: z.string().optional(),
  subject: z
    .string()
    .min(4, { message: 'Subject must be at least 4 characters.' })
    .max(120, { message: 'Subject cannot exceed 120 characters.' })
    .trim(),
  description: z
    .string()
    .min(10, { message: 'Please provide detailed description (at least 10 characters).' })
    .max(2000, { message: 'Description cannot exceed 2000 characters.' }),
});

export const completeTicketSchema = ticketStep1Schema.merge(ticketStep2Schema);

export type TicketStep1Input = z.infer<typeof ticketStep1Schema>;
export type TicketStep2Input = z.infer<typeof ticketStep2Schema>;
export type CompleteTicketInput = z.infer<typeof completeTicketSchema>;
