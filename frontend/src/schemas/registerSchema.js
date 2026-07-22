import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  phone_number: z.string().trim()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must be between 10 and 15 digits (optional leading +)'),
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});
