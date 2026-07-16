import { z } from 'zod'

// Shared enums
export const deviceStatusEnum = z.enum(['IN_WAREHOUSE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'])

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: nonEmpty('Username'),
  password: nonEmpty('Password'),
})

export const changePasswordSchema = z.object({
  currentPassword: nonEmpty('Current password'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export const forgotPasswordSchema = z.object({
  username: nonEmpty('Username'),
})

export const resetPasswordSchema = z.object({
  username: nonEmpty('Username'),
  code: nonEmpty('Reset code'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export const setupSchema = z.object({
  name: nonEmpty('Name'),
  username: nonEmpty('Username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ── Devices ──────────────────────────────────────────────────────────────────
const customValueSchema = z.object({
  customFieldId: nonEmpty('customFieldId'),
  value: z.string(),
})

const optionalDateString = z
  .string()
  .refine(value => value === '' || !Number.isNaN(Date.parse(value)), 'Invalid date')
  .optional()
  .nullable()

export const createDeviceSchema = z.object({
  name: nonEmpty('Device name'),
  serialNumber: nonEmpty('Serial number'),
  categoryId: nonEmpty('Category'),
  brandId: z.string().min(1).optional().nullable(),
  status: deviceStatusEnum.optional(),
  purchaseDate: optionalDateString,
  notes: z.string().optional(),
  customValues: z.array(customValueSchema).optional(),
  assignedToPersonnelId: z.string().min(1).optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'ASSIGNED' && !data.assignedToPersonnelId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Personnel is required when the initial status is Assigned',
      path: ['assignedToPersonnelId'],
    })
  }
})

export const updateDeviceSchema = z.object({
  name: z.string().trim().min(1).optional(),
  serialNumber: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional().nullable(),
  status: deviceStatusEnum.optional(),
  purchaseDate: optionalDateString,
  notes: z.string().optional(),
  customValues: z.array(customValueSchema).optional(),
})

// ── Categories / Fields ──────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: nonEmpty('Category name'),
  description: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
})

export const fieldTypeEnum = z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'EMAIL', 'SELECT', 'PHONE', 'URL'])

export const createFieldSchema = z.object({
  label: nonEmpty('Label'),
  fieldKey: nonEmpty('Field key'),
  fieldType: fieldTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  placeholder: z.string().optional(),
  order: z.number().int().optional(),
})

export const updateFieldSchema = z.object({
  label: z.string().trim().min(1).optional(),
  fieldType: fieldTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  placeholder: z.string().optional(),
  order: z.number().int().optional(),
})

export const reorderFieldsSchema = z.object({
  orderedIds: z.array(z.string().min(1)),
})

// ── Brands / Departments ─────────────────────────────────────────────────────
export const brandSchema = z.object({ name: nonEmpty('Brand name') })
export const departmentSchema = z.object({ name: nonEmpty('Department name') })

// ── Personnel ────────────────────────────────────────────────────────────────
export const createPersonnelSchema = z
  .object({
    name: nonEmpty('Name'),
    email: z.string().trim().email('Invalid email address'),
    departmentId: z.string().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    phone: z.string().optional(),
  })
  .refine(d => d.departmentId || d.department, {
    message: 'Department is required',
    path: ['department'],
  })

export const updatePersonnelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  departmentId: z.string().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
})

// ── Assignments ──────────────────────────────────────────────────────────────
export const createAssignmentSchema = z.object({
  deviceId: nonEmpty('Device'),
  personnelId: nonEmpty('Personnel'),
  notes: z.string().optional(),
})

export const returnAssignmentSchema = z.object({
  notes: z.string().optional(),
})

// ── Users ────────────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: nonEmpty('Name'),
  username: nonEmpty('Username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})
