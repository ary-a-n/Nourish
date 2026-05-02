import { z } from 'zod'

const mobileRegex = /^\+91\d{10}$/

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, 'Use format +91XXXXXXXXXX'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})

export const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, 'Use format +91XXXXXXXXXX'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})

export type RegisterSchema = z.infer<typeof registerSchema>
export type LoginSchema = z.infer<typeof loginSchema>
