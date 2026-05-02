import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  weight_kg: z.number().positive('Weight must be positive'),
  height_cm: z.number().positive('Height must be positive'),
  age_years: z.number().int().positive('Age must be positive'),
  gender: z.enum(['male', 'female']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active']),
  bp_stage: z.enum(['pre', 'stage1', 'stage2']),
  diet_pref: z.string().trim().min(1).max(40),
})

export type ProfileSchema = z.infer<typeof profileSchema>
