import { z } from 'zod';
import { ITEM_CATEGORIES, ITEM_STATUSES, USER_ROLES } from './constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginIdentifierSchema = z.object({
  email: z.string().min(3, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const itemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().max(1000, 'Description is too long').optional().or(z.literal('')),
  category: z.enum(ITEM_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  dateReported: z.string().optional(),
  dueDate: z.string().optional().or(z.literal('')),
  contactInfo: z.string().max(255, 'Contact info is too long').optional().or(z.literal('')),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
});

export const itemUpdateSchema = itemSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided',
);

export const itemStatusSchema = z.object({
  status: z.enum(ITEM_STATUSES),
  claimerId: z.string().optional(),
  flaggedReason: z.string().max(255).optional(),
  isFlagged: z.boolean().optional(),
});

export const itemQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(5000).optional(),
  status: z.enum(ITEM_STATUSES).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  search: z.string().trim().optional(),
  location: z.string().trim().optional(),
  date: z.enum(['today', '7days', '30days', '90days']).optional(),
  disposal: z.enum(['true', 'false']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const adminUserCreateSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(USER_ROLES).default('USER'),
});

export const adminUserUpdateSchema = z.object({
  id: z.string().min(1),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (value) => value.role !== undefined || value.isActive !== undefined,
  'At least one field must be provided',
);

export const adminAuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const adminSettingsSchema = z.object({
  siteName: z.string().min(3, 'Site name must be at least 3 characters'),
  maxFileSize: z.coerce.number().int().positive(),
  retentionDays: z.coerce.number().int().positive(),
  adminEmail: z.string().email('Invalid admin email'),
});

export const adminReportQuerySchema = z.object({
  type: z.enum(['items', 'claims', 'users', 'audit']).default('items'),
  page: z.coerce.number().int().positive().default(1),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
