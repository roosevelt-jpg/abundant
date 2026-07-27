import { z } from 'zod';

export const membershipApplicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country of residence is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  citizenship: z.string().min(1, 'Citizenship is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: 'Please select your gender',
  }),
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  industry: z.string().min(1, 'Industry is required'),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  yearsExperience: z.coerce.number().min(0).max(80).optional(),
  whyJoin: z.string().min(40, 'Please share at least a few sentences about why you want to join'),
  goals: z.array(z.string()).min(1, 'Select at least one goal'),
  tierInterest: z.enum(['free', 'global', 'founding_circle', 'private', 'not_sure']),
  referredByMember: z.boolean(),
  referrerName: z.string().optional(),
  howHeard: z.string().min(1, 'Please tell us how you heard about us'),
  termsAccepted: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  marketingConsent: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.referredByMember && !data.referrerName?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Referrer name is required', path: ['referrerName'] });
  }
});

export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

export const resourceSubmissionSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().min(3),
  category: z.string().min(1),
  description: z.string().min(20),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

export type ResourceSubmissionInput = z.infer<typeof resourceSubmissionSchema>;

export const signupFromInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const onboardingProfileSchema = z.object({
  photoUrl: z.string().optional(),
  bio: z.string().min(20, 'Please add a short bio'),
  expertiseTags: z.array(z.string()).min(1),
  directoryVisibility: z.enum(['public', 'members_only', 'hidden']),
  socialLinks: z.object({
    x: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  availableForIntros: z.boolean(),
  tier: z.enum(['global', 'founding_circle', 'private']),
  notificationPrefs: z.object({
    eventInvites: z.boolean(),
    weeklyDigest: z.boolean(),
    introRequests: z.boolean(),
  }),
});
