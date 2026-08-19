// src/lib/validations.ts
// All Zod schemas for input validation. Used in both API routes and frontend forms.

import { z } from 'zod';

export const StrongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().email('Invalid email address').toLowerCase(),
    password: StrongPasswordSchema,
    role: z.enum(['student', 'employer']),

    // Student fields
    university: z.string().min(2).max(120).optional(),
    department: z.string().min(2).max(60).optional(),
    yearOfStudy: z.number().int().min(1).max(5).optional(),
    studentId: z.string().max(20).optional(),

    // Employer fields
    companyName: z.string().min(2).max(120).optional(),
    industry: z.string().min(2).max(80).optional(),
    tradeLicenseNo: z.string().max(50).optional(),
    headquartersCity: z.string().max(60).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student') {
      if (!data.university) {
        ctx.addIssue({ code: 'custom', path: ['university'], message: 'University is required' });
      }
      if (!data.department) {
        ctx.addIssue({ code: 'custom', path: ['department'], message: 'Department is required' });
      }
      if (!data.yearOfStudy) {
        ctx.addIssue({
          code: 'custom',
          path: ['yearOfStudy'],
          message: 'Year of study is required',
        });
      }
    }

    if (data.role === 'employer') {
      if (!data.companyName) {
        ctx.addIssue({
          code: 'custom',
          path: ['companyName'],
          message: 'Company name is required',
        });
      }
      if (!data.industry) {
        ctx.addIssue({ code: 'custom', path: ['industry'], message: 'Industry is required' });
      }
    }
  });

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const ResendOTPSchema = z.object({
  email: z.string().email().toLowerCase(),
  type: z.enum(['email_verify', 'password_reset']),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  otp: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: StrongPasswordSchema,
});

// ── Profile ───────────────────────────────────────────────────────────────────

export const UpdateStudentProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, 'Invalid BD phone number (+8801XXXXXXXXX)')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500).optional(),

  // Profile image
  image: z.string().url().optional().nullable(),

  // ── Resume URLs ──────────────────────────────────────────────────────────
  // resumeUrl          → manually uploaded PDF (from student/profile page)
  // generatedResumeUrl → auto-generated PDF saved from Resume Builder page
  // These are intentionally separate — saving generated resume must NEVER
  // overwrite the student's manually uploaded resume.
  resumeUrl: z.string().url().optional().nullable(),
  generatedResumeUrl: z.string().url().optional().nullable(),
  gerUrl: z.string().url().optional().nullable(),

  university: z.string().max(120).optional(),
  department: z.string().max(60).optional(),
  yearOfStudy: z.number().int().min(1).max(5).optional(),
  currentSemester: z.string().max(30).optional(),
  cgpa: z.number().min(0).max(4.0).optional(),
  studentId: z.string().max(20).optional(),
  completedCourses: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(60).optional(),
  isGraduated: z.boolean().optional(),

  // ── Projects & certifications (saved from student profile form) ────────────
  projects: z
    .array(
      z.object({
        title: z.string().max(120),
        description: z.string().max(1000).optional().default(''),
        techStack: z.array(z.string()).optional().default([]),
        projectUrl: z.string().url().optional().or(z.literal('')),
        repoUrl: z.string().url().optional().or(z.literal('')),
      })
    )
    .optional(),

  certifications: z
    .array(
      z.object({
        name: z.string().max(120),
        issuedBy: z.string().max(120),
        credentialUrl: z.string().url().optional().or(z.literal('')),
      })
    )
    .optional(),
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  emailPreferences: z.record(z.string(), z.boolean()).optional(),
});

export const UpdateEmployerProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/)
    .optional()
    .or(z.literal('')),

  // ONLY company logo for employers
  companyLogo: z.string().url().optional().nullable(),
  companyName: z.string().min(2).max(120).optional(),
  industry: z.string().max(80).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyDescription: z.string().max(1000).optional(),
  headquartersCity: z.string().max(60).optional(),
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  emailPreferences: z.record(z.string(), z.boolean()).optional(),
});

export const UpdateAdvisorProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+?8?8?0?1[3-9]\d{8}$/)
    .optional()
    .or(z.literal(''))
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500).optional(),
  image: z.string().optional().nullable(),
  institutionName: z.string().max(120).optional(),
  advisorStaffId: z.string().max(30).optional(),
  designation: z.string().max(80).optional(),
  advisoryDepartment: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  emailPreferences: z.record(z.string(), z.boolean()).optional(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: StrongPasswordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const SetInitialPasswordSchema = z.object({
  newPassword: StrongPasswordSchema,
});

const AcademicAccountBaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address').toLowerCase(),
  temporaryPassword: StrongPasswordSchema,
  advisorStaffId: z.string().max(30).optional().or(z.literal('')),
  designation: z.string().max(80).optional().or(z.literal('')),
  advisoryDepartment: z.string().min(2).max(60),
});

export const CreateDeptHeadSchema = AcademicAccountBaseSchema.extend({
  institutionName: z.string().min(2).max(120),
});

export const CreateAdvisorSchema = AcademicAccountBaseSchema;

// ── Admin ─────────────────────────────────────────────────────────────────────

export const AdminApproveSchema = z.object({
  userId: z.string().length(24, 'Invalid user ID'),
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

export const AdminUserUpdateSchema = z
  .object({
    name: z.string().min(2).max(60).optional(),
    email: z.string().email().toLowerCase().optional(),
    phone: z
      .string()
      .regex(/^\+8801[3-9]\d{8}$/, 'Invalid BD phone number (+8801XXXXXXXXX)')
      .optional()
      .or(z.literal('')),
    role: z.enum(['student', 'employer', 'advisor', 'dept_head', 'admin']).optional(),
    image: z.string().url().optional().or(z.literal('')),
    bio: z.string().max(500).optional().or(z.literal('')),
    city: z.string().max(60).optional().or(z.literal('')),
    isVerified: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    premiumExpiresAt: z.string().optional().or(z.literal('')).nullable(),
    verificationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    verificationNote: z.string().max(500).optional().or(z.literal('')),
    university: z.string().max(120).optional().or(z.literal('')),
    department: z.string().max(60).optional().or(z.literal('')),
    yearOfStudy: z.number().int().min(1).max(5).optional(),
    currentSemester: z.string().max(30).optional().or(z.literal('')),
    cgpa: z.number().min(0).max(4.0).optional(),
    studentId: z.string().max(20).optional().or(z.literal('')),
    completedCourses: z.array(z.string().max(80)).optional(),
    skills: z.array(z.string().max(80)).optional(),
    companyName: z.string().max(120).optional().or(z.literal('')),
    industry: z.string().max(80).optional().or(z.literal('')),
    companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    companyWebsite: z.string().url().optional().or(z.literal('')),
    companyDescription: z.string().max(1000).optional().or(z.literal('')),
    tradeLicenseNo: z.string().max(50).optional().or(z.literal('')),
    headquartersCity: z.string().max(60).optional().or(z.literal('')),
    institutionName: z.string().max(120).optional().or(z.literal('')),
    advisorStaffId: z.string().max(30).optional().or(z.literal('')),
    designation: z.string().max(80).optional().or(z.literal('')),
    advisoryDepartment: z.string().max(60).optional().or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const AdminApplicationUpdateSchema = z
  .object({
    status: z
      .enum([
        'applied',
        'shortlisted',
        'under_review',
        'assessment_sent',
        'interview_scheduled',
        'rejected',
        'hired',
        'withdrawn',
      ])
      .optional(),
    note: z.string().max(500).optional().or(z.literal('')),
    employerNotes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => Boolean(data.status) || typeof data.employerNotes === 'string', {
    message: 'Provide a status update or employer notes.',
  });

export const AdminPaymentUpdateSchema = z
  .object({
    status: z.enum(['initiated', 'success', 'failed', 'refunded']).optional(),
    method: z.enum(['bkash', 'visa', 'mastercard']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const AdminSubscriptionUpdateSchema = z
  .object({
    plan: z.enum(['student_premium', 'employer_premium']).optional(),
    status: z.enum(['active', 'expired', 'cancelled']).optional(),
    endDate: z.string().optional().or(z.literal('')).nullable(),
    autoRenew: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const AdminSupportNotificationSchema = z
  .object({
    userId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    sendType: z
      .enum(['notification', 'support_message', 'both'])
      .optional()
      .default('notification'),
    type: z
      .enum([
        'status_update',
        'message_received',
        'advisor_note',
        'payment_received',
        'job_match',
        'badge_earned',
        'support_message',
        'admin_message',
        'system_message',
      ])
      .optional(),
    title: z.string().trim().max(120).optional().default(''),
    body: z.string().trim().max(1000).optional().default(''),
    link: z.string().trim().max(200).optional().or(z.literal('')),
    supportMessage: z.string().trim().max(5000).optional().default(''),
    messageType: z
      .enum(['support_message', 'admin_message', 'system_message'])
      .optional()
      .default('support_message'),
  })
  .superRefine((data, ctx) => {
    if (data.sendType === 'notification' || data.sendType === 'both') {
      if (!data.type) {
        ctx.addIssue({ code: 'custom', path: ['type'], message: 'Notification type is required' });
      }
      if (data.title.length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['title'],
          message: 'Notification title must be at least 3 characters',
        });
      }
      if (data.body.length < 5) {
        ctx.addIssue({
          code: 'custom',
          path: ['body'],
          message: 'Notification message must be at least 5 characters',
        });
      }
    }

    if ((data.sendType === 'support_message' || data.sendType === 'both') && !data.supportMessage) {
      ctx.addIssue({
        code: 'custom',
        path: ['supportMessage'],
        message: 'Support message is required',
      });
    }
  });

export const AdminMessageModerationSchema = z.object({
  isFlagged: z.boolean(),
  flagReason: z.string().max(500).optional().or(z.literal('')),
});

// ── Module 1 — Job, Recruitment & Career Events System ───────────────────────

const JobSchemaBase = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  type: z.enum(['internship', 'part-time', 'full-time', 'campus-drive', 'webinar', 'workshop']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  responsibilities: z.array(z.string().min(1)).max(20).optional().default([]),
  locationType: z.enum(['onsite', 'remote', 'hybrid']),
  city: z.string().max(80).optional(),

  stipendBDT: z.number().int().min(0).optional(),
  isStipendNegotiable: z.boolean().optional().default(false),

  applicationDeadline: z.string().min(1, 'Deadline is required'),
  startDate: z.string().optional(),
  durationMonths: z.number().int().min(1).max(24).optional(),

  targetUniversities: z.array(z.string()).optional().default([]),
  targetDepartments: z.array(z.string()).optional().default([]),
  targetYears: z.array(z.number().int().min(1).max(5)).optional().default([]),

  requiredSkills: z.array(z.string()).optional().default([]),
  minimumCGPA: z.number().min(0).max(4.0).optional(),
  requiredCourses: z.array(z.string()).optional().default([]),
  experienceExpectations: z.string().max(500).optional(),
  preferredCertifications: z.array(z.string()).optional().default([]),

  isBatchHiring: z.boolean().optional().default(false),
  batchUniversities: z.array(z.string()).optional().default([]),

  isActive: z.boolean().optional().default(true),
  academicSession: z.string().max(20).optional(),
});

function addJobDateValidationIssues(
  data: { type?: string; startDate?: string; applicationDeadline?: string },
  ctx: z.RefinementCtx,
  options?: { requireEventStartDate?: boolean }
) {
  const isEvent = data.type === 'webinar' || data.type === 'workshop';

  if (options?.requireEventStartDate && isEvent && !data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'Event date is required',
    });
  }

  if (data.startDate && data.applicationDeadline && data.startDate < data.applicationDeadline) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'Event date must be on or after the registration deadline',
    });
  }
}

export const CreateJobSchema = JobSchemaBase.superRefine((data, ctx) => {
  addJobDateValidationIssues(data, ctx, { requireEventStartDate: true });
});

export const UpdateJobSchema = JobSchemaBase.partial().superRefine((data, ctx) => {
  addJobDateValidationIssues(data, ctx);
});

export const AdminJobUpdateSchema = UpdateJobSchema.extend({
  isPremiumListing: z.boolean().optional(),
});

export const ApplyJobSchema = z.object({
  coverLetter: z.string().max(2000).optional(),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum([
    'applied',
    'shortlisted',
    'under_review',
    'assessment_sent',
    'interview_scheduled',
    'rejected',
    'hired',
    'withdrawn',
  ]),
  note: z.string().max(500).optional(),
});

const JobReviewBaseSchema = z.object({
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID'),
  revieweeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review recipient ID'),
  comment: z.string().trim().max(1500).optional().or(z.literal('')),
});

export const JobReviewSchema = z.discriminatedUnion('reviewType', [
  JobReviewBaseSchema.extend({
    reviewType: z.literal('student_to_employer'),
    overallRating: z.number().int().min(1).max(5),
    workEnvironmentRating: z.number().int().min(1).max(5),
    learningOpportunityRating: z.number().int().min(1).max(5),
    mentorshipQualityRating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(1, 'Written feedback is required').max(1500),
  }),
  JobReviewBaseSchema.extend({
    reviewType: z.literal('employer_to_student'),
    professionalismRating: z.number().int().min(1).max(5),
    punctualityRating: z.number().int().min(1).max(5),
    skillPerformanceRating: z.number().int().min(1).max(5),
    workQualityRating: z.number().int().min(1).max(5),
    isRecommended: z.boolean().default(false),
    recommendationText: z.string().trim().max(3000).optional().or(z.literal('')),
  }).superRefine((data, ctx) => {
    if (data.isRecommended && !data.recommendationText) {
      ctx.addIssue({
        code: 'custom',
        path: ['recommendationText'],
        message: 'Recommendation text is required for a formal recommendation',
      });
    }
  }),
]);

export const MentorSessionRequestSchema = z.object({
  mentorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID'),
  sessionType: z.enum(['resume_review', 'career_advice', 'mock_interview', 'general']),
  studentNotes: z.string().trim().min(1, 'Session notes are required').max(500),
});

export const MentorSessionUpdateSchema = z
  .object({
    status: z.enum(['accepted', 'rejected', 'completed', 'cancelled']),
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(15).max(240).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'accepted' && !data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'A schedule is required when accepting a session',
      });
    }
  });

export const MentorSessionRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().max(500).optional().or(z.literal('')),
});

const MessageAttachmentSchema = z.object({
  url: z.string().url().max(2000),
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(120),
});

export const SendMessageSchema = z
  .object({
    receiverId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
    content: z.string().trim().max(5000).optional().default(''),
    templateType: z.enum(['interview_invite', 'rejection', 'offer_letter']).nullable().optional(),
    attachments: z.array(MessageAttachmentSchema).max(5).optional().default([]),
    forwardedFromId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
    threadType: z.enum(['direct', 'freelance_order']).optional().default('direct'),
    relatedFreelanceOrderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.receiverId && !data.relatedFreelanceOrderId) {
      ctx.addIssue({ code: 'custom', path: ['receiverId'], message: 'A recipient is required' });
    }
    if (!data.content && data.attachments.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'A message or attachment is required',
      });
    }
  });

export const EditMessageSchema = z.object({
  messageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID'),
  content: z.string().trim().min(1, 'Content cannot be empty').max(5000),
});

export const ReadMessageThreadSchema = z.object({
  threadId: z.string().trim().min(1).max(200),
});

export const OpportunityRecommendationSchema = z.object({
  studentId: z.string().length(24, 'Invalid student ID'),
  category: z.literal('job'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(160),
  description: z.string().min(12, 'Description must be at least 12 characters').max(2400),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  focusSkills: z.array(z.string().max(80)).max(8).optional().default([]),
  linkedJobId: z.string().length(24, 'Select a job to recommend'),
  resourceUrl: z.string().url().optional().or(z.literal('')),
  fitScore: z.number().min(0).max(100).optional(),
});

export const UpdateOpportunityRecommendationSchema = z.object({
  status: z.enum(['active', 'archived']),
});

export const EmployerRecommendationRequestDecisionSchema = z.object({
  requestStatus: z.enum(['accepted', 'rejected', 'hold']),
  employerResponseNote: z.string().max(1200).optional().or(z.literal('')),
});

export const AcademicReviewSchema = z.object({
  studentId: z.string().length(24, 'Invalid student ID'),
  headline: z.string().min(3).max(160),
  summary: z.string().min(20).max(2400),
  strengths: z.array(z.string().max(120)).max(6).optional().default([]),
  growthAreas: z.array(z.string().max(120)).max(6).optional().default([]),
  readinessLevel: z.enum(['priority_support', 'developing', 'ready']),
  profileScore: z.number().min(0).max(100).optional(),
});

export const UpdateAcademicReviewSchema = z.object({
  status: z.enum(['active', 'archived']),
});

const HiringAssetSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(160),
  type: z.string().min(1).max(120),
});

const AssessmentQuestionSchema = z.object({
  index: z.number().int().min(0),
  type: z.enum(['mcq', 'short_answer', 'coding', 'case_study']),
  questionText: z.string().min(10).max(4000),
  marks: z.number().int().min(1).max(100),
  options: z.array(z.string().min(1).max(300)).max(8).optional().default([]),
  correctOptionIndex: z.number().int().min(0).max(7).optional(),
  acceptedAnswers: z.array(z.string().min(1).max(300)).max(8).optional().default([]),
  enablePlagiarismCheck: z.boolean().optional(),
  language: z.enum(['javascript', 'typescript', 'python', 'java', 'cpp']).optional(),
  starterCode: z.string().max(20000).optional().or(z.literal('')),
  testCases: z
    .array(
      z.object({
        input: z.string().max(2000),
        expectedOutput: z.string().max(4000),
        isSample: z.boolean().optional(),
      })
    )
    .max(20)
    .optional()
    .default([]),
  rubric: z.string().max(2000).optional().or(z.literal('')),
  attachments: z.array(HiringAssetSchema).max(5).optional().default([]),
  maxWords: z.number().int().min(10).max(5000).optional(),
});

const AssessmentDefinitionBaseSchema = z.object({
  jobId: z.string().length(24),
  title: z.string().min(3).max(160),
  type: z.enum(['mcq', 'short_answer', 'coding', 'case_study', 'mixed']),
  instructions: z.string().max(4000).optional().or(z.literal('')),
  durationMinutes: z.number().int().min(5).max(480),
  totalMarks: z.number().int().min(1).max(1000),
  passingMarks: z.number().int().min(0).max(1000),
  isTimedAutoSubmit: z.boolean().optional(),
  allowLateSubmission: z.boolean().optional(),
  dueAt: z.string().optional().or(z.literal('')).nullable(),
  reminderOffsetsMinutes: z.array(z.number().int().min(15).max(10080)).max(5).optional(),
  questions: z.array(AssessmentQuestionSchema).min(1).max(30),
  applicationIds: z.array(z.string().length(24)).max(100).optional().default([]),
});

export const CreateAssessmentSchema = AssessmentDefinitionBaseSchema.superRefine((data, ctx) => {
  if (data.passingMarks > data.totalMarks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passingMarks'],
      message: 'Passing marks cannot be greater than total marks.',
    });
  }
});

export const UpdateAssessmentSchema = AssessmentDefinitionBaseSchema.omit({
  dueAt: true,
  reminderOffsetsMinutes: true,
  applicationIds: true,
}).superRefine((data, ctx) => {
  if (data.passingMarks > data.totalMarks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passingMarks'],
      message: 'Passing marks cannot be greater than total marks.',
    });
  }
});

export const AssessmentActionSchema = z.object({
  action: z.enum(['assign', 'archive', 'reactivate']),
  applicationIds: z.array(z.string().length(24)).max(100).optional().default([]),
  dueAt: z.string().optional().or(z.literal('')).nullable(),
});

export const AssessmentRunSchema = z.object({
  questionIndex: z.number().int().min(0),
  code: z.string().min(1).max(50000),
  stdin: z.string().max(4000).optional().or(z.literal('')),
});

export const AssessmentSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        answerText: z.string().max(10000).optional().or(z.literal('')),
        selectedOptionIndex: z.number().int().min(0).max(7).optional(),
        code: z.string().max(50000).optional().or(z.literal('')),
        uploadedFiles: z.array(HiringAssetSchema).max(8).optional().default([]),
      })
    )
    .min(1)
    .max(30),
  autoSubmit: z.boolean().optional(),
});

export const GradeAssessmentSchema = z.object({
  manualAdjustments: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        marksAwarded: z.number().min(0).max(100),
        evaluationNotes: z.string().max(2000).optional().or(z.literal('')),
      })
    )
    .max(30)
    .optional()
    .default([]),
});

export const ScheduleInterviewSchema = z.object({
  applicationIds: z.array(z.string().length(24)).min(1).max(50),
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  mode: z.enum(['one_on_one', 'panel']).optional(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(240),
  panelists: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        email: z.string().email().optional().or(z.literal('')),
      })
    )
    .max(8)
    .optional()
    .default([]),
});

export const InterviewUpdateSchema = z.object({
  action: z.enum([
    'update_notes',
    'update_scorecard',
    'mark_live',
    'mark_completed',
    'cancel',
    'consent_granted',
    'consent_declined',
    'recording_uploaded',
  ]),
  liveNotes: z.string().max(12000).optional().or(z.literal('')),
  scorecard: z
    .object({
      communication: z.number().min(0).max(100).optional(),
      technical: z.number().min(0).max(100).optional(),
      problemSolving: z.number().min(0).max(100).optional(),
      cultureFit: z.number().min(0).max(100).optional(),
      confidence: z.number().min(0).max(100).optional(),
      recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no']).optional(),
      summary: z.string().max(3000).optional().or(z.literal('')),
    })
    .optional(),
  recordingAsset: HiringAssetSchema.optional(),
});

const FreelanceAssetSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(160),
  type: z.string().min(1).max(120),
});

export const FreelanceListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum([
    'web-dev',
    'graphic-design',
    'content-writing',
    'data-analysis',
    'video-editing',
    'other',
  ]),
  skills: z.array(z.string().min(1).max(80)).max(20).default([]),
  priceType: z.enum(['fixed', 'hourly']),
  priceBDT: z.number().int().min(1, 'Price must be at least 1 BDT'),
  deliveryDays: z.number().int().min(1).max(90),
  sampleFiles: z.array(FreelanceAssetSchema).max(6).default([]),
  isActive: z.boolean().optional(),
});

export const FreelanceOrderCreateSchema = z.object({
  listingId: z.string().length(24, 'Invalid listing ID'),
  requirements: z.string().min(20, 'Please provide enough project details').max(3000),
  requirementsFiles: z.array(FreelanceAssetSchema).max(6).default([]),
  quotedRateBDT: z.number().int().min(1).max(500000).optional(),
  quotedHours: z.number().int().min(1).max(400).optional(),
  proposalNote: z.string().max(1000).optional().or(z.literal('')),
  paymentMethod: z.enum(['bkash', 'visa', 'mastercard']),
});

export const FreelanceOrderActionSchema = z.object({
  action: z.enum([
    'accept_proposal',
    'counter_proposal',
    'reject_proposal',
    'deliver',
    'request_revision',
    'confirm_completion',
    'cancel',
    'mark_disputed',
    'release_escrow',
    'refund_escrow',
  ]),
  quotedRateBDT: z.number().int().min(1).max(500000).optional(),
  quotedHours: z.number().int().min(1).max(400).optional(),
  proposalNote: z.string().max(1000).optional().or(z.literal('')),
  deliveryNote: z.string().max(2000).optional().or(z.literal('')),
  deliveryFiles: z.array(FreelanceAssetSchema).max(8).optional().default([]),
  clientNote: z.string().max(2000).optional().or(z.literal('')),
});

export const FreelanceReviewSchema = z.object({
  orderId: z.string().length(24, 'Invalid order ID'),
  reviewType: z.enum(['client_to_student', 'student_to_client']),
  overallRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  requirementsClarityRating: z.number().int().min(1).max(5).optional(),
  paymentPromptnessRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  skillPerformanceRating: z.number().int().min(1).max(5).optional(),
  workQualityRating: z.number().int().min(1).max(5).optional(),
  isRecommended: z.boolean().optional(),
  recommendationText: z.string().max(3000).optional().or(z.literal('')),
  comment: z.string().max(1500).optional().or(z.literal('')),
});

export const AdminFreelanceOrderUpdateSchema = z.object({
  action: z.enum(['release_escrow', 'refund_escrow', 'mark_disputed', 'restore_in_progress']),
  adminNote: z.string().max(1000).optional().or(z.literal('')),
});

export const FreelanceWithdrawalCreateSchema = z.object({
  amountBDT: z.number().int().min(1).max(500000),
  note: z.string().max(500).optional().or(z.literal('')),
});

export const AdminFreelanceWithdrawalUpdateSchema = z.object({
  action: z.enum(['process', 'reject']),
  adminNote: z.string().max(1000).optional().or(z.literal('')),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
export type UpdateEmployerProfileInput = z.infer<typeof UpdateEmployerProfileSchema>;
export type CreateDeptHeadInput = z.infer<typeof CreateDeptHeadSchema>;
export type CreateAdvisorInput = z.infer<typeof CreateAdvisorSchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
export type OpportunityRecommendationInput = z.infer<typeof OpportunityRecommendationSchema>;
export type FreelanceListingInput = z.infer<typeof FreelanceListingSchema>;
export type FreelanceOrderCreateInput = z.infer<typeof FreelanceOrderCreateSchema>;
export type FreelanceWithdrawalCreateInput = z.infer<typeof FreelanceWithdrawalCreateSchema>;
