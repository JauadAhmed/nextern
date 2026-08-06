'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Activity,
  BadgeDollarSign,
  BellRing,
  BriefcaseBusiness,
  ChartColumn,
  CheckCheck,
  CircleAlert,
  Crown,
  LifeBuoy,
  LoaderCircle,
  MessageSquareWarning,
  PencilLine,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './SuperAdminConsole.module.css';

type SectionKey =
  | 'overview'
  | 'verification'
  | 'users'
  | 'jobs'
  | 'applications'
  | 'finance'
  | 'freelance'
  | 'support'
  | 'messages'
  | 'analytics';

type NoticeState = { tone: 'success' | 'error'; text: string } | null;

type CurrentUser = {
  name: string;
  email: string;
};

const SECTION_META: Record<
  SectionKey,
  { label: string; description: string; icon: typeof Activity; accent: string }
> = {
  overview: {
    label: 'Overview',
    description: 'Cross-platform health, revenue, growth, and priority alerts.',
    icon: ShieldCheck,
    accent: '#0f766e',
  },
  verification: {
    label: 'Verification',
    description: 'Approve or reject registrations with notes and filters.',
    icon: CheckCheck,
    accent: '#1d4ed8',
  },
  users: {
    label: 'Users',
    description: 'Edit user records, permissions, and premium access.',
    icon: Users,
    accent: '#c2410c',
  },
  jobs: {
    label: 'Jobs',
    description: 'Moderate listings, premium placement, and deadlines.',
    icon: BriefcaseBusiness,
    accent: '#7c2d12',
  },
  applications: {
    label: 'Applications',
    description: 'Manage pipeline states and candidate outcomes.',
    icon: UserCog,
    accent: '#4338ca',
  },
  finance: {
    label: 'Finance',
    description: 'Track subscriptions, payment records, refunds, and premium handling.',
    icon: BadgeDollarSign,
    accent: '#166534',
  },
  freelance: {
    label: 'Freelance',
    description: 'Operate escrow, platform-fee, account-balance, and withdrawal workflows.',
    icon: BriefcaseBusiness,
    accent: '#0f766e',
  },
  support: {
    label: 'Support',
    description: 'Send admin notices and manage system alerts.',
    icon: LifeBuoy,
    accent: '#9f1239',
  },
  messages: {
    label: 'Messages',
    description: 'Moderate all cross-platform conversations.',
    icon: MessageSquareWarning,
    accent: '#831843',
  },
  analytics: {
    label: 'Analytics',
    description: 'Review growth curves, conversion signals, and usage.',
    icon: ChartColumn,
    accent: '#6d28d9',
  },
};

const PIE_COLORS = ['#0f766e', '#1d4ed8', '#c2410c', '#7c3aed', '#166534', '#be123c'];

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function roleLabel(role?: string) {
  if (!role) return 'Unknown';
  if (role === 'dept_head') return 'Department head';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status?: string) {
  const value = status ?? '';
  if (['approved', 'active', 'success', 'hired', 'premium'].includes(value)) return 'success';
  if (['pending', 'initiated', 'shortlisted', 'under_review', 'assessment_sent'].includes(value))
    return 'warning';
  if (['rejected', 'failed', 'refunded', 'cancelled', 'expired', 'withdrawn'].includes(value))
    return 'danger';
  return 'neutral';
}

function normalizeLabel(value?: string) {
  return value ? value.replace(/_/g, ' ') : '—';
}

function idFromMaybeObject(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: string })._id);
  }
  return '';
}

function labelFromMaybeUser(value: unknown) {
  if (!value) return 'Unknown';
  if (typeof value === 'string') return value;
  const item = value as Record<string, string>;
  return item.companyName || item.name || item.email || 'Unknown';
}

function listToArray(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberFromInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed');
  }

  return data;
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Activity;
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricIconWrap}>
        <Icon size={18} />
      </div>
      <div>
        <div className={styles.metricLabel}>{title}</div>
        <div className={styles.metricValue}>{value}</div>
        <div className={styles.metricHint}>{hint}</div>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value?: string }) {
  const tone = statusTone(value);
  const toneClass =
    tone === 'success'
      ? styles.badgeSuccess
      : tone === 'warning'
        ? styles.badgeWarning
        : tone === 'danger'
          ? styles.badgeDanger
          : styles.badgeNeutral;

  return <span className={`${styles.badge} ${toneClass}`}>{normalizeLabel(value)}</span>;
}

function SectionEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.emptyState}>
      <CircleAlert size={18} />
      <div>
        <div className={styles.emptyTitle}>{title}</div>
        <p className={styles.emptyText}>{description}</p>
      </div>
    </div>
  );
}

export default function SuperAdminConsole({ currentUser }: { currentUser: CurrentUser }) {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [notice, setNotice] = useState<NoticeState>(null);
  const [overviewRange, setOverviewRange] = useState('30d');

  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [verificationFilters, setVerificationFilters] = useState({ role: 'all', search: '' });
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  const [userFilters, setUserFilters] = useState({
    role: 'all',
    status: 'all',
    premium: 'all',
    emailVerified: 'all',
    search: '',
  });
  const [usersData, setUsersData] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userForm, setUserForm] = useState<any>(null);
  const [userSaving, setUserSaving] = useState(false);

  const [jobFilters, setJobFilters] = useState({
    type: 'all',
    active: 'all',
    premium: 'all',
    search: '',
  });
  const [jobsData, setJobsData] = useState<any>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState<any>(null);
  const [jobSaving, setJobSaving] = useState(false);

  const [applicationFilters, setApplicationFilters] = useState({
    status: 'all',
    eventRegistration: 'all',
    search: '',
  });
  const [applicationsData, setApplicationsData] = useState<any>(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [applicationForm, setApplicationForm] = useState<any>(null);
  const [applicationSaving, setApplicationSaving] = useState(false);

  const [financeFilters, setFinanceFilters] = useState({
    paymentStatus: 'all',
    method: 'all',
    type: 'all',
    plan: 'all',
    search: '',
  });
  const [financeData, setFinanceData] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, any>>({});
  const [subscriptionDrafts, setSubscriptionDrafts] = useState<Record<string, any>>({});
  const [financeActionId, setFinanceActionId] = useState<string | null>(null);
  const [freelanceAdminNotes, setFreelanceAdminNotes] = useState<Record<string, string>>({});
  const [freelanceListingActionId, setFreelanceListingActionId] = useState<string | null>(null);

  const [supportFilters, setSupportFilters] = useState({
    flaggedOnly: 'true',
    unreadOnly: 'all',
    search: '',
  });
  const [supportData, setSupportData] = useState<any>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportComposer, setSupportComposer] = useState({
    userId: '',
    type: 'status_update',
    title: '',
    body: '',
    link: '',
  });
  const [messageReasonDrafts, setMessageReasonDrafts] = useState<Record<string, string>>({});
  const [supportActionId, setSupportActionId] = useState<string | null>(null);

  const [messagesFilters, setMessagesFilters] = useState({
    flaggedOnly: 'all',
    search: '',
  });
  const [messagesData, setMessagesData] = useState<any>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesActionId, setMessagesActionId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    void loadOverview();
  }, [overviewRange]);

  useEffect(() => {
    if (activeSection === 'verification' && !verificationData) void loadVerification();
    if (activeSection === 'users' && !usersData) void loadUsers();
    if (activeSection === 'jobs' && !jobsData) void loadJobs();
    if (activeSection === 'applications' && !applicationsData) void loadApplications();
    if ((activeSection === 'finance' || activeSection === 'freelance') && !financeData) {
      void loadFinance();
    }
    if (activeSection === 'support' && !supportData) void loadSupport();
    if (activeSection === 'messages' && !messagesData) void loadMessages();
    if (activeSection === 'analytics' && !overview) void loadOverview();
  }, [
    activeSection,
    verificationData,
    usersData,
    jobsData,
    applicationsData,
    financeData,
    supportData,
    messagesData,
    overview,
  ]);

  useEffect(() => {
    if (!selectedUser) {
      setUserForm(null);
      return;
    }

    setUserForm({
      name: selectedUser.name ?? '',
      email: selectedUser.email ?? '',
      phone: selectedUser.phone ?? '',
      role: selectedUser.role ?? 'student',
      isVerified: Boolean(selectedUser.isVerified),
      verificationStatus: selectedUser.verificationStatus ?? 'pending',
      verificationNote: selectedUser.verificationNote ?? '',
      isPremium: Boolean(selectedUser.isPremium),
      premiumExpiresAt: toDateInput(selectedUser.premiumExpiresAt),
      bio: selectedUser.bio ?? '',
      city: selectedUser.city ?? '',
      university: selectedUser.university ?? '',
      department: selectedUser.department ?? '',
      yearOfStudy: selectedUser.yearOfStudy ? String(selectedUser.yearOfStudy) : '',
      currentSemester: selectedUser.currentSemester ?? '',
      cgpa: selectedUser.cgpa ? String(selectedUser.cgpa) : '',
      studentId: selectedUser.studentId ?? '',
      completedCourses: (selectedUser.completedCourses ?? []).join(', '),
      skills: (selectedUser.skills ?? []).join(', '),
      companyName: selectedUser.companyName ?? '',
      industry: selectedUser.industry ?? '',
      companySize: selectedUser.companySize ?? '',
      companyWebsite: selectedUser.companyWebsite ?? '',
      companyDescription: selectedUser.companyDescription ?? '',
      tradeLicenseNo: selectedUser.tradeLicenseNo ?? '',
      headquartersCity: selectedUser.headquartersCity ?? '',
      institutionName: selectedUser.institutionName ?? '',
      advisorStaffId: selectedUser.advisorStaffId ?? '',
      designation: selectedUser.designation ?? '',
      advisoryDepartment: selectedUser.advisoryDepartment ?? '',
    });
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedJob) {
      setJobForm(null);
      return;
    }

    setJobForm({
      title: selectedJob.title ?? '',
      description: selectedJob.description ?? '',
      type: selectedJob.type ?? 'internship',
      locationType: selectedJob.locationType ?? 'onsite',
      city: selectedJob.city ?? '',
      applicationDeadline: toDateInput(selectedJob.applicationDeadline),
      startDate: toDateInput(selectedJob.startDate),
      durationMonths: selectedJob.durationMonths ? String(selectedJob.durationMonths) : '',
      targetUniversities: (selectedJob.targetUniversities ?? []).join(', '),
      targetDepartments: (selectedJob.targetDepartments ?? []).join(', '),
      targetYears: (selectedJob.targetYears ?? []).join(', '),
      requiredSkills: (selectedJob.requiredSkills ?? []).join(', '),
      requiredCourses: (selectedJob.requiredCourses ?? []).join(', '),
      minimumCGPA: selectedJob.minimumCGPA ? String(selectedJob.minimumCGPA) : '',
      responsibilities: (selectedJob.responsibilities ?? []).join('\n'),
      isActive: Boolean(selectedJob.isActive),
      isPremiumListing: Boolean(selectedJob.isPremiumListing),
    });
  }, [selectedJob]);

  useEffect(() => {
    if (!selectedApplication) {
      setApplicationForm(null);
      return;
    }

    setApplicationForm({
      status: selectedApplication.status ?? 'applied',
      note: '',
      employerNotes: selectedApplication.employerNotes ?? '',
    });
  }, [selectedApplication]);

  useEffect(() => {
    if (!financeData) return;

    setPaymentDrafts(
      Object.fromEntries(
        (financeData.payments ?? []).map((payment: any) => [
          payment._id,
          { status: payment.status, method: payment.method },
        ])
      )
    );

    setSubscriptionDrafts(
      Object.fromEntries(
        (financeData.subscriptions ?? []).map((subscription: any) => [
          subscription._id,
          {
            status: subscription.status,
            plan: subscription.plan,
            endDate: toDateInput(subscription.endDate),
            autoRenew: subscription.autoRenew,
          },
        ])
      )
    );

    setFreelanceAdminNotes(
      Object.fromEntries(
        (financeData.freelanceOrders ?? []).map((order: any) => [order._id, order.adminNote ?? ''])
      )
    );
  }, [financeData]);

  const sectionMeta = SECTION_META[activeSection];

  const heroHighlights = useMemo(() => {
    if (!overview?.summary) return [];
    return [
      `${overview.summary.totalUsers} users`,
      `${overview.summary.activeJobs} active jobs`,
      `${formatMoney(overview.summary.totalRevenueBDT)} subscription revenue`,
      `${formatMoney(overview.summary.freelanceGMVBDT ?? 0)} freelance GMV`,
      `${overview.summary.verifiedFreelancers ?? 0} verified freelancers`,
    ];
  }, [overview]);

  function showNotice(tone: 'success' | 'error', text: string) {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 3600);
  }

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      setOverview(await requestJson(`/api/admin/overview?range=${overviewRange}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load overview.');
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadVerification() {
    setVerificationLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'pending',
        limit: '20',
        role: verificationFilters.role,
      });
      if (verificationFilters.search.trim())
        params.set('search', verificationFilters.search.trim());
      setVerificationData(await requestJson(`/api/admin/users?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load verification.');
    } finally {
      setVerificationLoading(false);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (userFilters.role !== 'all') params.set('role', userFilters.role);
      if (userFilters.status !== 'all') params.set('status', userFilters.status);
      if (userFilters.premium !== 'all') params.set('premium', userFilters.premium);
      if (userFilters.emailVerified !== 'all')
        params.set('emailVerified', userFilters.emailVerified);
      if (userFilters.search.trim()) params.set('search', userFilters.search.trim());
      setUsersData(await requestJson(`/api/admin/users?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (jobFilters.type !== 'all') params.set('type', jobFilters.type);
      if (jobFilters.active !== 'all') params.set('active', jobFilters.active);
      if (jobFilters.premium !== 'all') params.set('premium', jobFilters.premium);
      if (jobFilters.search.trim()) params.set('search', jobFilters.search.trim());
      setJobsData(await requestJson(`/api/admin/jobs?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load jobs.');
    } finally {
      setJobsLoading(false);
    }
  }

  async function loadApplications() {
    setApplicationsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (applicationFilters.status !== 'all') params.set('status', applicationFilters.status);
      if (applicationFilters.eventRegistration !== 'all') {
        params.set('eventRegistration', applicationFilters.eventRegistration);
      }
      if (applicationFilters.search.trim()) params.set('search', applicationFilters.search.trim());
      setApplicationsData(await requestJson(`/api/admin/applications?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load applications.');
    } finally {
      setApplicationsLoading(false);
    }
  }

  async function loadFinance() {
    setFinanceLoading(true);
    try {
      const params = new URLSearchParams({ limit: '12' });
      if (financeFilters.paymentStatus !== 'all')
        params.set('paymentStatus', financeFilters.paymentStatus);
      if (financeFilters.method !== 'all') params.set('method', financeFilters.method);
      if (financeFilters.type !== 'all') params.set('type', financeFilters.type);
      if (financeFilters.plan !== 'all') params.set('plan', financeFilters.plan);
      if (financeFilters.search.trim()) params.set('search', financeFilters.search.trim());
      setFinanceData(await requestJson(`/api/admin/finance?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load finance.');
    } finally {
      setFinanceLoading(false);
    }
  }

  async function loadSupport() {
    setSupportLoading(true);
    try {
      const params = new URLSearchParams({ limit: '12' });
      if (supportFilters.flaggedOnly !== 'all')
        params.set('flaggedOnly', supportFilters.flaggedOnly);
      if (supportFilters.unreadOnly !== 'all') params.set('unreadOnly', supportFilters.unreadOnly);
      if (supportFilters.search.trim()) params.set('search', supportFilters.search.trim());
      setSupportData(await requestJson(`/api/admin/support?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load support.');
    } finally {
      setSupportLoading(false);
    }
  }

  async function loadMessages() {
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (messagesFilters.flaggedOnly !== 'all')
        params.set('flaggedOnly', messagesFilters.flaggedOnly);
      if (messagesFilters.search.trim()) params.set('search', messagesFilters.search.trim());
      setMessagesData(await requestJson(`/api/admin/messages?${params.toString()}`));
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleVerificationAction(userId: string, action: 'approve' | 'reject') {
    setReviewActionId(userId);
    try {
      await requestJson(`/api/admin/approve/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note: reviewNote[userId] || undefined }),
      });
      showNotice('success', action === 'approve' ? 'Account approved.' : 'Account rejected.');
      await Promise.all([loadVerification(), loadUsers(), loadOverview()]);
    } catch (error) {
      showNotice(
        'error',
        error instanceof Error ? error.message : 'Failed to update verification.'
      );
    } finally {
      setReviewActionId(null);
    }
  }

  async function handleSaveUser() {
    if (!selectedUser || !userForm) return;
    setUserSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isVerified: userForm.isVerified,
        verificationStatus: userForm.verificationStatus,
        verificationNote: userForm.verificationNote,
        isPremium: userForm.isPremium,
        premiumExpiresAt: userForm.premiumExpiresAt || null,
        bio: userForm.bio,
        city: userForm.city,
      };

      if (userForm.role === 'student') {
        Object.assign(payload, {
          university: userForm.university,
          department: userForm.department,
          yearOfStudy: numberFromInput(userForm.yearOfStudy),
          currentSemester: userForm.currentSemester,
          cgpa: numberFromInput(userForm.cgpa),
          studentId: userForm.studentId,
          completedCourses: listToArray(userForm.completedCourses),
          skills: listToArray(userForm.skills),
        });
      }

      if (userForm.role === 'employer') {
        Object.assign(payload, {
          companyName: userForm.companyName,
          industry: userForm.industry,
          companySize: userForm.companySize || undefined,
          companyWebsite: userForm.companyWebsite,
          companyDescription: userForm.companyDescription,
          tradeLicenseNo: userForm.tradeLicenseNo,
          headquartersCity: userForm.headquartersCity,
        });
      }

      if (userForm.role === 'advisor' || userForm.role === 'dept_head') {
        Object.assign(payload, {
          institutionName: userForm.institutionName,
          advisorStaffId: userForm.advisorStaffId,
          designation: userForm.designation,
          advisoryDepartment: userForm.advisoryDepartment,
        });
      }

      await requestJson(`/api/admin/users/${selectedUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      showNotice('success', 'User updated.');
      await Promise.all([loadUsers(), loadVerification(), loadOverview(), loadFinance()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to save user.');
    } finally {
      setUserSaving(false);
    }
  }

  function handleDeleteUser() {
    if (!selectedUser) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete user?',
      description: 'Delete this user and related records?',
      onConfirm: async () => {
        setConfirmModal(null);
        setUserSaving(true);
        try {
          await requestJson(`/api/admin/users/${selectedUser._id}`, { method: 'DELETE' });
          setSelectedUser(null);
          showNotice('success', 'User deleted.');
          await Promise.all([loadUsers(), loadVerification(), loadOverview(), loadFinance()]);
        } catch (error) {
          showNotice('error', error instanceof Error ? error.message : 'Failed to delete user.');
        } finally {
          setUserSaving(false);
        }
      },
    });
  }

  async function handleSaveJob() {
    if (!selectedJob || !jobForm) return;
    setJobSaving(true);
    try {
      await requestJson(`/api/jobs/${selectedJob._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: jobForm.title,
          description: jobForm.description,
          type: jobForm.type,
          locationType: jobForm.locationType,
          city: jobForm.city,
          applicationDeadline: jobForm.applicationDeadline || undefined,
          startDate: jobForm.startDate || undefined,
          durationMonths: numberFromInput(jobForm.durationMonths),
          targetUniversities: listToArray(jobForm.targetUniversities),
          targetDepartments: listToArray(jobForm.targetDepartments),
          targetYears: listToArray(jobForm.targetYears)
            .map((item) => Number(item))
            .filter(Boolean),
          requiredSkills: listToArray(jobForm.requiredSkills),
          requiredCourses: listToArray(jobForm.requiredCourses),
          minimumCGPA: numberFromInput(jobForm.minimumCGPA),
          responsibilities: listToArray(jobForm.responsibilities),
          isActive: jobForm.isActive,
          isPremiumListing: jobForm.isPremiumListing,
        }),
      });
      showNotice('success', 'Job updated.');
      await Promise.all([loadJobs(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to save job.');
    } finally {
      setJobSaving(false);
    }
  }

  function handleDeleteJob(jobId?: string) {
    const targetId = jobId ?? selectedJob?._id;
    if (!targetId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete listing?',
      description: 'Delete this listing and its related pipeline records?',
      onConfirm: async () => {
        setConfirmModal(null);
        setJobSaving(true);
        try {
          await requestJson(`/api/jobs/${targetId}`, { method: 'DELETE' });
          setSelectedJob(null);
          showNotice('success', 'Job deleted.');
          await Promise.all([loadJobs(), loadOverview(), loadApplications()]);
        } catch (error) {
          showNotice('error', error instanceof Error ? error.message : 'Failed to delete job.');
        } finally {
          setJobSaving(false);
        }
      },
    });
  }

  async function handleSaveApplication() {
    if (!selectedApplication || !applicationForm) return;
    setApplicationSaving(true);
    try {
      await requestJson(`/api/admin/applications/${selectedApplication._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: applicationForm.status,
          note: applicationForm.note,
          employerNotes: applicationForm.employerNotes,
        }),
      });
      showNotice('success', 'Application updated.');
      await Promise.all([loadApplications(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to save application.');
    } finally {
      setApplicationSaving(false);
    }
  }

  function handleDeleteApplication(applicationId?: string) {
    const targetId = applicationId ?? selectedApplication?._id;
    if (!targetId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete application?',
      description: 'Delete this application and related submissions?',
      onConfirm: async () => {
        setConfirmModal(null);
        setApplicationSaving(true);
        try {
          await requestJson(`/api/admin/applications/${targetId}`, { method: 'DELETE' });
          setSelectedApplication(null);
          showNotice('success', 'Application deleted.');
          await Promise.all([loadApplications(), loadOverview()]);
        } catch (error) {
          showNotice(
            'error',
            error instanceof Error ? error.message : 'Failed to delete application.'
          );
        } finally {
          setApplicationSaving(false);
        }
      },
    });
  }

  async function handleSavePayment(paymentId: string) {
    setFinanceActionId(paymentId);
    try {
      await requestJson(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify(paymentDrafts[paymentId]),
      });
      showNotice('success', 'Payment updated.');
      await Promise.all([loadFinance(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to save payment.');
    } finally {
      setFinanceActionId(null);
    }
  }

  async function handleSaveSubscription(subscriptionId: string) {
    setFinanceActionId(subscriptionId);
    try {
      const draft = subscriptionDrafts[subscriptionId];
      await requestJson(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: draft.status,
          plan: draft.plan,
          endDate: draft.endDate || null,
          autoRenew: draft.autoRenew,
        }),
      });
      showNotice('success', 'Subscription updated.');
      await Promise.all([loadFinance(), loadUsers(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to save subscription.');
    } finally {
      setFinanceActionId(null);
    }
  }

  async function handleFreelanceOrderAction(
    orderId: string,
    action: 'release_escrow' | 'refund_escrow' | 'mark_disputed' | 'restore_in_progress'
  ) {
    setFinanceActionId(`freelance:${orderId}:${action}`);
    try {
      await requestJson(`/api/admin/freelance/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          adminNote: freelanceAdminNotes[orderId] || undefined,
        }),
      });
      showNotice('success', 'Freelance escrow updated.');
      await Promise.all([loadFinance(), loadOverview()]);
    } catch (error) {
      showNotice(
        'error',
        error instanceof Error ? error.message : 'Failed to update freelance order.'
      );
    } finally {
      setFinanceActionId(null);
    }
  }

  async function handleToggleFreelanceListing(listingId: string, isActive: boolean) {
    setFreelanceListingActionId(listingId);
    try {
      await requestJson(`/api/freelance/listings/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      showNotice('success', isActive ? 'Listing activated.' : 'Listing paused.');
      await Promise.all([loadFinance(), loadOverview()]);
    } catch (error) {
      showNotice(
        'error',
        error instanceof Error ? error.message : 'Failed to update freelance listing.'
      );
    } finally {
      setFreelanceListingActionId(null);
    }
  }

  async function handleFreelanceWithdrawalAction(
    withdrawalId: string,
    action: 'process' | 'reject'
  ) {
    setFinanceActionId(`withdrawal:${withdrawalId}:${action}`);
    try {
      await requestJson(`/api/admin/freelance/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          adminNote: '',
        }),
      });
      showNotice(
        'success',
        action === 'process' ? 'Withdrawal marked as processed.' : 'Withdrawal rejected.'
      );
      await Promise.all([loadFinance(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to update withdrawal.');
    } finally {
      setFinanceActionId(null);
    }
  }

  async function handleSupportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSupportActionId('send');
    try {
      await requestJson('/api/admin/support', {
        method: 'POST',
        body: JSON.stringify(supportComposer),
      });
      setSupportComposer({ userId: '', type: 'status_update', title: '', body: '', link: '' });
      showNotice('success', 'Support notification sent.');
      await Promise.all([loadSupport(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to send notification.');
    } finally {
      setSupportActionId(null);
    }
  }

  async function handleModerateMessage(messageId: string, isFlagged: boolean) {
    setSupportActionId(messageId);
    try {
      await requestJson(`/api/admin/support/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isFlagged,
          flagReason: messageReasonDrafts[messageId] || undefined,
        }),
      });
      showNotice('success', isFlagged ? 'Message flagged.' : 'Message restored.');
      await Promise.all([loadSupport(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to update message.');
    } finally {
      setSupportActionId(null);
    }
  }

  async function handleToggleFlagMessage(messageId: string, isFlagged: boolean) {
    setMessagesActionId(messageId);
    try {
      await requestJson(`/api/admin/messages`, {
        method: 'PATCH',
        body: JSON.stringify({
          messageId,
          isFlagged,
          flagReason: messageReasonDrafts[messageId] || undefined,
        }),
      });
      showNotice('success', isFlagged ? 'Message flagged.' : 'Message restored.');
      await Promise.all([loadMessages(), loadOverview()]);
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Failed to update message.');
    } finally {
      setMessagesActionId(null);
    }
  }

  function handleDeleteMessage(messageId: string) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete message?',
      description: 'Are you sure you want to delete this message for everyone?',
      onConfirm: async () => {
        setConfirmModal(null);
        setMessagesActionId(messageId);
        try {
          await requestJson(`/api/admin/messages?id=${messageId}`, { method: 'DELETE' });
          showNotice('success', 'Message deleted for everyone.');
          await Promise.all([loadMessages(), loadOverview()]);
        } catch (error) {
          showNotice('error', error instanceof Error ? error.message : 'Failed to delete message.');
        } finally {
          setMessagesActionId(null);
        }
      },
    });
  }

  function openSupportForUser(userId: string) {
    setActiveSection('support');
    setSupportComposer((current) => ({ ...current, userId }));
    if (!supportData) void loadSupport();
  }

  const navItems = (Object.keys(SECTION_META) as SectionKey[]).map((key) => {
    const item = SECTION_META[key];
    const Icon = item.icon;
    const badge =
      key === 'verification'
        ? (verificationData?.summary?.pendingReviews ??
          overview?.breakdowns?.verificationQueue?.reduce(
            (sum: number, row: any) => sum + row.value,
            0
          ) ??
          0)
        : key === 'support'
          ? (supportData?.summary?.flaggedMessages ?? overview?.summary?.flaggedMessages ?? 0)
          : 0;

    return (
      <button
        key={key}
        className={`${styles.navButton} ${activeSection === key ? styles.navButtonActive : ''}`}
        onClick={() => setActiveSection(key)}
        type="button"
      >
        <span className={styles.navButtonInner}>
          <Icon size={16} />
          <span>{item.label}</span>
        </span>
        {badge > 0 ? <span className={styles.navBadge}>{badge}</span> : null}
      </button>
    );
  });

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <div className={styles.brandMark}>N</div>
            <div>
              <div className={styles.brandEyebrow}>Nextern Control</div>
              <div className={styles.brandTitle}>Superadmin Workspace</div>
            </div>
          </div>
          <p className={styles.sidebarCopy}>
            Verification, accounts, finance, support, and analytics from one command surface.
          </p>
          <nav className={styles.nav}>{navItems}</nav>
          <div className={styles.sidebarShortcutGroup}>
            <div className={styles.sidebarGroupLabel}>Academic tools</div>
            <Link href="/admin/dept-heads" className={styles.sidebarShortcutLink}>
              <span className={styles.navButtonInner}>
                <UserCog size={16} />
                <span>Department heads</span>
              </span>
              <span className={styles.sidebarShortcutMeta}>Open page</span>
            </Link>
          </div>
          <div className={styles.sidebarFoot}>
            <div className={styles.sidebarStat}>
              <span>Revenue</span>
              <strong>{formatMoney(overview?.summary?.totalRevenueBDT ?? 0)}</strong>
            </div>
            <div className={styles.sidebarStat}>
              <span>Premium users</span>
              <strong>{overview?.summary?.premiumUsers ?? 0}</strong>
            </div>
            <button
              className={styles.ghostButton}
              onClick={() => void signOut({ callbackUrl: '/' })}
              type="button"
            >
              <X size={14} />
              Sign out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div>
              <div className={styles.heroEyebrow}>Superadmin access</div>
              <h1 className={styles.heroTitle}>{sectionMeta.label}</h1>
              <p className={styles.heroDescription}>{sectionMeta.description}</p>
            </div>
            <div className={styles.topbarActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => void loadOverview()}
                type="button"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <div className={styles.adminIdentity}>
                <span className={styles.adminAvatar}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className={styles.adminName}>{currentUser.name}</div>
                  <div className={styles.adminEmail}>{currentUser.email}</div>
                </div>
              </div>
            </div>
          </header>

          {notice ? (
            <div
              className={`${styles.notice} ${
                notice.tone === 'success' ? styles.noticeSuccess : styles.noticeError
              }`}
            >
              {notice.tone === 'success' ? <CheckCheck size={16} /> : <CircleAlert size={16} />}
              <span>{notice.text}</span>
            </div>
          ) : null}

          <section className={styles.heroPanel}>
            <div>
              <div className={styles.heroPanelTitle}>Platform command center</div>
              <p className={styles.heroPanelText}>
                Full superadmin coverage for verification, CRUD control, finance, premium access,
                analytics, and support moderation.
              </p>
            </div>
            <div className={styles.heroChips}>
              {heroHighlights.map((item) => (
                <span key={item} className={styles.heroChip}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          {activeSection === 'overview' ? (
            <section className={styles.section}>
              <div className={styles.rangeTabs}>
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    className={`${styles.rangeButton} ${overviewRange === range ? styles.rangeButtonActive : ''}`}
                    onClick={() => setOverviewRange(range)}
                    type="button"
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className={styles.metricsGrid}>
                <MetricCard
                  title="Users"
                  value={`${overview?.summary?.totalUsers ?? 0}`}
                  hint="All roles"
                  icon={Users}
                />
                <MetricCard
                  title="Active jobs"
                  value={`${overview?.summary?.activeJobs ?? 0}`}
                  hint="Live listings"
                  icon={BriefcaseBusiness}
                />
                <MetricCard
                  title="Applications"
                  value={`${overview?.summary?.totalApplications ?? 0}`}
                  hint="Pipeline volume"
                  icon={UserCog}
                />
                <MetricCard
                  title="Revenue"
                  value={formatMoney(overview?.summary?.totalRevenueBDT ?? 0)}
                  hint="Subscription revenue"
                  icon={BadgeDollarSign}
                />
                <MetricCard
                  title="Premium"
                  value={`${overview?.summary?.premiumUsers ?? 0}`}
                  hint="Elevated access"
                  icon={Crown}
                />
                <MetricCard
                  title="Freelance GMV"
                  value={formatMoney(overview?.summary?.freelanceGMVBDT ?? 0)}
                  hint="Funded escrow volume"
                  icon={BriefcaseBusiness}
                />
                <MetricCard
                  title="Escrow held"
                  value={formatMoney(overview?.summary?.freelanceEscrowHeldBDT ?? 0)}
                  hint="Currently held by superadmin"
                  icon={ShieldCheck}
                />
                <MetricCard
                  title="Verified freelancers"
                  value={`${overview?.summary?.verifiedFreelancers ?? 0}`}
                  hint="Badge holders"
                  icon={CheckCheck}
                />
                <MetricCard
                  title="Alerts"
                  value={`${overview?.summary?.flaggedMessages ?? 0}`}
                  hint="Support attention"
                  icon={MessageSquareWarning}
                />
              </div>

              <div className={styles.chartGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Application growth</h2>
                      <p>Daily application creation across the selected range.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrap}>
                    {overviewLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : (
                      <ResponsiveContainer
                        width="100%"
                        height={280}
                        initialDimension={{ width: 800, height: 280 }}
                      >
                        <AreaChart data={overview?.activity?.applications ?? []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                          <XAxis dataKey="label" tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <Tooltip />
                          <Area dataKey="value" stroke="#0f766e" fill="#99f6e4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Subscription revenue trend</h2>
                      <p>Collected premium revenue over time.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrap}>
                    {overviewLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : (
                      <ResponsiveContainer
                        width="100%"
                        height={280}
                        initialDimension={{ width: 800, height: 280 }}
                      >
                        <BarChart data={overview?.activity?.revenue ?? []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                          <XAxis dataKey="label" tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <Tooltip formatter={(value) => formatMoney(Number(value))} />
                          <Bar dataKey="value" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Freelance GMV trend</h2>
                      <p>Escrow-funded freelance order volume over time.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrap}>
                    {overviewLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : (
                      <ResponsiveContainer
                        width="100%"
                        height={280}
                        initialDimension={{ width: 800, height: 280 }}
                      >
                        <BarChart data={overview?.activity?.freelanceGmv ?? []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                          <XAxis dataKey="label" tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#5b6b81', fontSize: 12 }} />
                          <Tooltip formatter={(value) => formatMoney(Number(value))} />
                          <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.twoColumnGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Role mix</h2>
                      <p>Current distribution of accounts by role.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrapSmall}>
                    {overview?.breakdowns?.userRoles?.length ? (
                      <ResponsiveContainer
                        width="100%"
                        height={260}
                        initialDimension={{ width: 800, height: 260 }}
                      >
                        <PieChart>
                          <Pie
                            data={overview.breakdowns.userRoles.map((row: any) => ({
                              name: roleLabel(row._id),
                              value: row.value,
                            }))}
                            innerRadius={58}
                            outerRadius={94}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {overview.breakdowns.userRoles.map((row: any, index: number) => (
                              <Cell key={row._id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <SectionEmpty
                        title="No role data"
                        description="User distribution will appear here."
                      />
                    )}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Top universities</h2>
                      <p>Largest student cohorts and opportunity score averages.</p>
                    </div>
                  </div>
                  {overview?.highlights?.topUniversities?.length ? (
                    <div className={styles.listTable}>
                      {overview.highlights.topUniversities.map((row: any) => (
                        <div key={row._id} className={styles.listRow}>
                          <div>
                            <div className={styles.rowTitle}>{row._id}</div>
                            <div className={styles.rowMeta}>{row.students} students</div>
                          </div>
                          <strong>{row.avgOpportunityScore.toFixed(1)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <SectionEmpty
                      title="No university analytics"
                      description="Student cohorts will show here."
                    />
                  )}
                </div>
              </div>

              <div className={styles.twoColumnGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Freelance marketplace</h2>
                      <p>Snapshot of escrow health and verified delivery momentum.</p>
                    </div>
                  </div>
                  <div className={styles.listTable}>
                    {[
                      {
                        label: 'Active listings',
                        value: `${overview?.summary?.activeFreelanceListings ?? 0}`,
                        tone: 'success',
                      },
                      {
                        label: 'Verified freelancers',
                        value: `${overview?.summary?.verifiedFreelancers ?? 0}`,
                        tone: 'neutral',
                      },
                      {
                        label: 'Escrow held',
                        value: formatMoney(overview?.summary?.freelanceEscrowHeldBDT ?? 0),
                        tone: 'warning',
                      },
                      {
                        label: 'Disputed orders',
                        value: `${overview?.summary?.disputedFreelanceOrders ?? 0}`,
                        tone: 'danger',
                      },
                      {
                        label: '30 day GMV',
                        value: formatMoney(overview?.summary?.rolling30DayFreelanceGMVBDT ?? 0),
                        tone: 'success',
                      },
                    ].map((row) => (
                      <div key={row.label} className={styles.listRow}>
                        <div>
                          <div className={styles.rowTitle}>{row.label}</div>
                          <div className={styles.rowMeta}>Freelance marketplace monitoring</div>
                        </div>
                        <span
                          className={`${styles.badge} ${
                            row.tone === 'success'
                              ? styles.badgeSuccess
                              : row.tone === 'warning'
                                ? styles.badgeWarning
                                : row.tone === 'danger'
                                  ? styles.badgeDanger
                                  : styles.badgeNeutral
                          }`}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Top employers</h2>
                      <p>Highest-traction hiring organizations on the platform.</p>
                    </div>
                  </div>
                  {overview?.highlights?.topEmployers?.length ? (
                    <div className={styles.listTable}>
                      {overview.highlights.topEmployers.map((row: any) => (
                        <div key={row.employerId} className={styles.listRow}>
                          <div>
                            <div className={styles.rowTitle}>{row.companyName}</div>
                            <div className={styles.rowMeta}>
                              {row.ownerName} · {row.jobs} jobs · {row.premiumListings} premium
                            </div>
                          </div>
                          <strong>{formatCompactNumber(row.totalApplications)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <SectionEmpty
                      title="No employer analytics"
                      description="Top hiring organizations will show here."
                    />
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'verification' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.filters}>
                  <div className={styles.filterField}>
                    <label>Role</label>
                    <select
                      value={verificationFilters.role}
                      onChange={(event) =>
                        setVerificationFilters((current) => ({
                          ...current,
                          role: event.target.value,
                        }))
                      }
                    >
                      <option value="all">All pending roles</option>
                      <option value="employer">Employers</option>
                      <option value="advisor">Advisors</option>
                      <option value="dept_head">Department heads</option>
                      <option value="student">Students</option>
                    </select>
                  </div>
                  <div className={styles.filterFieldWide}>
                    <label>Search</label>
                    <input
                      value={verificationFilters.search}
                      onChange={(event) =>
                        setVerificationFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                      placeholder="Name, email, company, institution"
                    />
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => void loadVerification()}
                    type="button"
                  >
                    <Search size={14} />
                    Apply filters
                  </button>
                </div>

                {verificationLoading ? (
                  <div className={styles.loaderWrap}>
                    <LoaderCircle className={styles.spin} size={20} />
                  </div>
                ) : verificationData?.users?.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Context</th>
                          <th>Email</th>
                          <th>Review note</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationData.users.map((user: any) => (
                          <tr key={user._id}>
                            <td>
                              <div className={styles.personCell}>
                                <span className={styles.avatar}>
                                  {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                                </span>
                                <div>
                                  <div className={styles.rowTitle}>{user.name}</div>
                                  <div className={styles.rowMeta}>{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{roleLabel(user.role)}</td>
                            <td>
                              {user.companyName || user.institutionName || user.university || '—'}
                            </td>
                            <td>
                              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <input
                                value={reviewNote[user._id] ?? ''}
                                onChange={(event) =>
                                  setReviewNote((current) => ({
                                    ...current,
                                    [user._id]: event.target.value,
                                  }))
                                }
                                placeholder="Optional reason"
                              />
                            </td>
                            <td>
                              <div className={styles.actionRow}>
                                <button
                                  className={styles.primaryButton}
                                  onClick={() => void handleVerificationAction(user._id, 'approve')}
                                  type="button"
                                  disabled={reviewActionId === user._id}
                                >
                                  Approve
                                </button>
                                <button
                                  className={styles.dangerButton}
                                  onClick={() => void handleVerificationAction(user._id, 'reject')}
                                  type="button"
                                  disabled={reviewActionId === user._id}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <SectionEmpty
                    title="Queue is clear"
                    description="No registrations match the current filters."
                  />
                )}
              </div>
            </section>
          ) : null}

          {activeSection === 'users' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.filters}>
                  <div className={styles.filterField}>
                    <label>Role</label>
                    <select
                      value={userFilters.role}
                      onChange={(event) =>
                        setUserFilters((current) => ({ ...current, role: event.target.value }))
                      }
                    >
                      <option value="all">All roles</option>
                      <option value="student">Students</option>
                      <option value="employer">Employers</option>
                      <option value="advisor">Advisors</option>
                      <option value="dept_head">Department heads</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  <div className={styles.filterField}>
                    <label>Status</label>
                    <select
                      value={userFilters.status}
                      onChange={(event) =>
                        setUserFilters((current) => ({ ...current, status: event.target.value }))
                      }
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className={styles.filterField}>
                    <label>Premium</label>
                    <select
                      value={userFilters.premium}
                      onChange={(event) =>
                        setUserFilters((current) => ({ ...current, premium: event.target.value }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="true">Premium</option>
                      <option value="false">Free</option>
                    </select>
                  </div>
                  <div className={styles.filterFieldWide}>
                    <label>Search</label>
                    <input
                      value={userFilters.search}
                      onChange={(event) =>
                        setUserFilters((current) => ({ ...current, search: event.target.value }))
                      }
                      placeholder="Name, email, company, campus"
                    />
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => void loadUsers()}
                    type="button"
                  >
                    <Search size={14} />
                    Refresh users
                  </button>
                </div>

                {usersLoading ? (
                  <div className={styles.loaderWrap}>
                    <LoaderCircle className={styles.spin} size={20} />
                  </div>
                ) : usersData?.users?.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Context</th>
                          <th>Verification</th>
                          <th>Premium</th>
                          <th>Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.users.map((user: any) => (
                          <tr key={user._id}>
                            <td>
                              <div className={styles.personCell}>
                                <span className={styles.avatar}>
                                  {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                                </span>
                                <div>
                                  <div className={styles.rowTitle}>{user.name}</div>
                                  <div className={styles.rowMeta}>{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{roleLabel(user.role)}</td>
                            <td>
                              {user.companyName || user.university || user.institutionName || '—'}
                            </td>
                            <td>
                              <StatusBadge value={user.verificationStatus} />
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${user.isPremium ? styles.badgeSuccess : styles.badgeNeutral}`}
                              >
                                {user.isPremium ? 'Premium' : 'Free'}
                              </span>
                            </td>
                            <td>{formatDate(user.updatedAt, true)}</td>
                            <td>
                              <div className={styles.actionRow}>
                                <button
                                  className={styles.secondaryButton}
                                  onClick={() => setSelectedUser(user)}
                                  type="button"
                                >
                                  <PencilLine size={14} />
                                  Edit
                                </button>
                                <button
                                  className={styles.ghostButton}
                                  onClick={() => openSupportForUser(user._id)}
                                  type="button"
                                >
                                  <BellRing size={14} />
                                  Support
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <SectionEmpty
                    title="No users found"
                    description="Adjust the filters to see more accounts."
                  />
                )}
              </div>

              {selectedUser && userForm ? (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>User editor</h2>
                      <p>{selectedUser.name}</p>
                    </div>
                    <button
                      className={styles.iconButton}
                      onClick={() => setSelectedUser(null)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.filterField}>
                      <label>Name</label>
                      <input
                        value={userForm.name}
                        onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Email</label>
                      <input
                        value={userForm.email}
                        onChange={(event) =>
                          setUserForm({ ...userForm, email: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Phone</label>
                      <input
                        value={userForm.phone}
                        onChange={(event) =>
                          setUserForm({ ...userForm, phone: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Role</label>
                      <select
                        value={userForm.role}
                        onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                      >
                        <option value="student">Student</option>
                        <option value="employer">Employer</option>
                        <option value="advisor">Advisor</option>
                        <option value="dept_head">Department head</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Verification</label>
                      <select
                        value={userForm.verificationStatus}
                        onChange={(event) =>
                          setUserForm({ ...userForm, verificationStatus: event.target.value })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Premium</label>
                      <select
                        value={String(userForm.isPremium)}
                        onChange={(event) =>
                          setUserForm({ ...userForm, isPremium: event.target.value === 'true' })
                        }
                      >
                        <option value="true">Premium</option>
                        <option value="false">Free</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Premium expiry</label>
                      <input
                        type="date"
                        value={userForm.premiumExpiresAt}
                        onChange={(event) =>
                          setUserForm({ ...userForm, premiumExpiresAt: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Email verified</label>
                      <select
                        value={String(userForm.isVerified)}
                        onChange={(event) =>
                          setUserForm({ ...userForm, isVerified: event.target.value === 'true' })
                        }
                      >
                        <option value="true">Verified</option>
                        <option value="false">Pending</option>
                      </select>
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Verification note</label>
                      <textarea
                        rows={3}
                        value={userForm.verificationNote}
                        onChange={(event) =>
                          setUserForm({ ...userForm, verificationNote: event.target.value })
                        }
                      />
                    </div>
                    {userForm.role === 'student' ? (
                      <>
                        <div className={styles.filterField}>
                          <label>University</label>
                          <input
                            value={userForm.university}
                            onChange={(event) =>
                              setUserForm({ ...userForm, university: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>Department</label>
                          <input
                            value={userForm.department}
                            onChange={(event) =>
                              setUserForm({ ...userForm, department: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>Year</label>
                          <input
                            value={userForm.yearOfStudy}
                            onChange={(event) =>
                              setUserForm({ ...userForm, yearOfStudy: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>CGPA</label>
                          <input
                            value={userForm.cgpa}
                            onChange={(event) =>
                              setUserForm({ ...userForm, cgpa: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterFieldFull}>
                          <label>Skills</label>
                          <textarea
                            rows={3}
                            value={userForm.skills}
                            onChange={(event) =>
                              setUserForm({ ...userForm, skills: event.target.value })
                            }
                          />
                        </div>
                      </>
                    ) : null}
                    {userForm.role === 'employer' ? (
                      <>
                        <div className={styles.filterField}>
                          <label>Company</label>
                          <input
                            value={userForm.companyName}
                            onChange={(event) =>
                              setUserForm({ ...userForm, companyName: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>Industry</label>
                          <input
                            value={userForm.industry}
                            onChange={(event) =>
                              setUserForm({ ...userForm, industry: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>Website</label>
                          <input
                            value={userForm.companyWebsite}
                            onChange={(event) =>
                              setUserForm({ ...userForm, companyWebsite: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterField}>
                          <label>License</label>
                          <input
                            value={userForm.tradeLicenseNo}
                            onChange={(event) =>
                              setUserForm({ ...userForm, tradeLicenseNo: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.filterFieldFull}>
                          <label>Description</label>
                          <textarea
                            rows={4}
                            value={userForm.companyDescription}
                            onChange={(event) =>
                              setUserForm({ ...userForm, companyDescription: event.target.value })
                            }
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className={styles.editorActions}>
                    <button
                      className={styles.dangerButton}
                      onClick={() => void handleDeleteUser()}
                      type="button"
                      disabled={userSaving}
                    >
                      <Trash2 size={14} />
                      Delete user
                    </button>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void handleSaveUser()}
                      type="button"
                      disabled={userSaving}
                    >
                      {userSaving ? (
                        <LoaderCircle className={styles.spin} size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      Save user
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeSection === 'jobs' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.filters}>
                  <div className={styles.filterField}>
                    <label>Type</label>
                    <select
                      value={jobFilters.type}
                      onChange={(event) =>
                        setJobFilters((current) => ({ ...current, type: event.target.value }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="internship">Internship</option>
                      <option value="part-time">Part-time</option>
                      <option value="full-time">Full-time</option>
                      <option value="campus-drive">Campus drive</option>
                      <option value="webinar">Webinar</option>
                      <option value="workshop">Workshop</option>
                    </select>
                  </div>
                  <div className={styles.filterField}>
                    <label>State</label>
                    <select
                      value={jobFilters.active}
                      onChange={(event) =>
                        setJobFilters((current) => ({ ...current, active: event.target.value }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className={styles.filterField}>
                    <label>Placement</label>
                    <select
                      value={jobFilters.premium}
                      onChange={(event) =>
                        setJobFilters((current) => ({ ...current, premium: event.target.value }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="true">Premium</option>
                      <option value="false">Standard</option>
                    </select>
                  </div>
                  <div className={styles.filterFieldWide}>
                    <label>Search</label>
                    <input
                      value={jobFilters.search}
                      onChange={(event) =>
                        setJobFilters((current) => ({ ...current, search: event.target.value }))
                      }
                      placeholder="Title, company, description"
                    />
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => void loadJobs()}
                    type="button"
                  >
                    <Search size={14} />
                    Refresh jobs
                  </button>
                </div>

                {jobsLoading ? (
                  <div className={styles.loaderWrap}>
                    <LoaderCircle className={styles.spin} size={20} />
                  </div>
                ) : jobsData?.jobs?.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Listing</th>
                          <th>Employer</th>
                          <th>Deadline</th>
                          <th>Pipeline</th>
                          <th>State</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobsData.jobs.map((job: any) => (
                          <tr key={job._id}>
                            <td>
                              <div className={styles.compactStack}>
                                <div className={styles.rowTitle}>{job.title}</div>
                                <div className={styles.rowMeta}>{job.companyName}</div>
                              </div>
                            </td>
                            <td>{labelFromMaybeUser(job.employerId)}</td>
                            <td>{formatDate(job.applicationDeadline)}</td>
                            <td>
                              <div className={styles.compactStack}>
                                <span>{job.applicationCount} applications</span>
                                <span className={styles.rowMeta}>{job.viewCount} views</span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.compactStack}>
                                <StatusBadge value={job.isActive ? 'active' : 'inactive'} />
                                <span
                                  className={`${styles.badge} ${job.isPremiumListing ? styles.badgeSuccess : styles.badgeNeutral}`}
                                >
                                  {job.isPremiumListing ? 'Premium' : 'Standard'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionRow}>
                                <button
                                  className={styles.secondaryButton}
                                  onClick={() => setSelectedJob(job)}
                                  type="button"
                                >
                                  <PencilLine size={14} />
                                  Edit
                                </button>
                                <button
                                  className={styles.dangerButton}
                                  onClick={() => void handleDeleteJob(job._id)}
                                  type="button"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <SectionEmpty
                    title="No listings found"
                    description="Try broadening the job filters."
                  />
                )}
              </div>

              {selectedJob && jobForm ? (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Listing editor</h2>
                      <p>{selectedJob.title}</p>
                    </div>
                    <button
                      className={styles.iconButton}
                      onClick={() => setSelectedJob(null)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.filterField}>
                      <label>Title</label>
                      <input
                        value={jobForm.title}
                        onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })}
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Type</label>
                      <select
                        value={jobForm.type}
                        onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })}
                      >
                        <option value="internship">Internship</option>
                        <option value="part-time">Part-time</option>
                        <option value="full-time">Full-time</option>
                        <option value="campus-drive">Campus drive</option>
                        <option value="webinar">Webinar</option>
                        <option value="workshop">Workshop</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Location</label>
                      <select
                        value={jobForm.locationType}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, locationType: event.target.value })
                        }
                      >
                        <option value="onsite">Onsite</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>City</label>
                      <input
                        value={jobForm.city}
                        onChange={(event) => setJobForm({ ...jobForm, city: event.target.value })}
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Deadline</label>
                      <input
                        type="date"
                        value={jobForm.applicationDeadline}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, applicationDeadline: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Minimum CGPA</label>
                      <input
                        value={jobForm.minimumCGPA}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, minimumCGPA: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Description</label>
                      <textarea
                        rows={4}
                        value={jobForm.description}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, description: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Responsibilities</label>
                      <textarea
                        rows={4}
                        value={jobForm.responsibilities}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, responsibilities: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Required skills</label>
                      <textarea
                        rows={3}
                        value={jobForm.requiredSkills}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, requiredSkills: event.target.value })
                        }
                      />
                    </div>
                    <label className={styles.toggleLabelWide}>
                      <input
                        type="checkbox"
                        checked={jobForm.isActive}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, isActive: event.target.checked })
                        }
                      />
                      Listing is active
                    </label>
                    <label className={styles.toggleLabelWide}>
                      <input
                        type="checkbox"
                        checked={jobForm.isPremiumListing}
                        onChange={(event) =>
                          setJobForm({ ...jobForm, isPremiumListing: event.target.checked })
                        }
                      />
                      Premium placement
                    </label>
                  </div>
                  <div className={styles.editorActions}>
                    <button
                      className={styles.dangerButton}
                      onClick={() => void handleDeleteJob()}
                      type="button"
                      disabled={jobSaving}
                    >
                      <Trash2 size={14} />
                      Delete listing
                    </button>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void handleSaveJob()}
                      type="button"
                      disabled={jobSaving}
                    >
                      {jobSaving ? (
                        <LoaderCircle className={styles.spin} size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      Save listing
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeSection === 'applications' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.filters}>
                  <div className={styles.filterField}>
                    <label>Status</label>
                    <select
                      value={applicationFilters.status}
                      onChange={(event) =>
                        setApplicationFilters((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="under_review">Under review</option>
                      <option value="assessment_sent">Assessment sent</option>
                      <option value="interview_scheduled">Interview scheduled</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div className={styles.filterField}>
                    <label>Type</label>
                    <select
                      value={applicationFilters.eventRegistration}
                      onChange={(event) =>
                        setApplicationFilters((current) => ({
                          ...current,
                          eventRegistration: event.target.value,
                        }))
                      }
                    >
                      <option value="all">All</option>
                      <option value="false">Job applications</option>
                      <option value="true">Event registrations</option>
                    </select>
                  </div>
                  <div className={styles.filterFieldWide}>
                    <label>Search</label>
                    <input
                      value={applicationFilters.search}
                      onChange={(event) =>
                        setApplicationFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                      placeholder="Candidate, employer, job title"
                    />
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => void loadApplications()}
                    type="button"
                  >
                    <Search size={14} />
                    Refresh pipeline
                  </button>
                </div>

                {applicationsLoading ? (
                  <div className={styles.loaderWrap}>
                    <LoaderCircle className={styles.spin} size={20} />
                  </div>
                ) : applicationsData?.applications?.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Opportunity</th>
                          <th>Employer</th>
                          <th>Status</th>
                          <th>Fit</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicationsData.applications.map((application: any) => (
                          <tr key={application._id}>
                            <td>
                              <div className={styles.compactStack}>
                                <div className={styles.rowTitle}>
                                  {typeof application.studentId === 'string'
                                    ? application.studentId
                                    : application.studentId?.name}
                                </div>
                                <div className={styles.rowMeta}>
                                  {typeof application.studentId === 'string'
                                    ? ''
                                    : application.studentId?.university ||
                                      application.studentId?.email}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className={styles.compactStack}>
                                <div className={styles.rowTitle}>
                                  {typeof application.jobId === 'string'
                                    ? application.jobId
                                    : application.jobId?.title}
                                </div>
                                <div className={styles.rowMeta}>
                                  {application.isEventRegistration
                                    ? 'Event registration'
                                    : 'Job application'}
                                </div>
                              </div>
                            </td>
                            <td>{labelFromMaybeUser(application.employerId)}</td>
                            <td>
                              <StatusBadge value={application.status} />
                            </td>
                            <td>
                              {application.fitScore ? `${Math.round(application.fitScore)}%` : '—'}
                            </td>
                            <td>{formatDate(application.appliedAt, true)}</td>
                            <td>
                              <div className={styles.actionRow}>
                                <button
                                  className={styles.secondaryButton}
                                  onClick={() => setSelectedApplication(application)}
                                  type="button"
                                >
                                  <PencilLine size={14} />
                                  Update
                                </button>
                                <button
                                  className={styles.dangerButton}
                                  onClick={() => void handleDeleteApplication(application._id)}
                                  type="button"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <SectionEmpty
                    title="No applications found"
                    description="No submissions match the current filters."
                  />
                )}
              </div>

              {selectedApplication && applicationForm ? (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Pipeline editor</h2>
                      <p>
                        {typeof selectedApplication.jobId === 'string'
                          ? selectedApplication.jobId
                          : selectedApplication.jobId?.title}
                      </p>
                    </div>
                    <button
                      className={styles.iconButton}
                      onClick={() => setSelectedApplication(null)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.filterField}>
                      <label>Status</label>
                      <select
                        value={applicationForm.status}
                        onChange={(event) =>
                          setApplicationForm({ ...applicationForm, status: event.target.value })
                        }
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="under_review">Under review</option>
                        <option value="assessment_sent">Assessment sent</option>
                        <option value="interview_scheduled">Interview scheduled</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Fit score</label>
                      <input
                        value={
                          selectedApplication.fitScore ? `${selectedApplication.fitScore}%` : '—'
                        }
                        disabled
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Status note</label>
                      <textarea
                        rows={3}
                        value={applicationForm.note}
                        onChange={(event) =>
                          setApplicationForm({ ...applicationForm, note: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Employer notes</label>
                      <textarea
                        rows={4}
                        value={applicationForm.employerNotes}
                        onChange={(event) =>
                          setApplicationForm({
                            ...applicationForm,
                            employerNotes: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.editorActions}>
                    <button
                      className={styles.dangerButton}
                      onClick={() => void handleDeleteApplication()}
                      type="button"
                      disabled={applicationSaving}
                    >
                      <Trash2 size={14} />
                      Delete application
                    </button>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void handleSaveApplication()}
                      type="button"
                      disabled={applicationSaving}
                    >
                      {applicationSaving ? (
                        <LoaderCircle className={styles.spin} size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      Save pipeline
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeSection === 'finance' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Finance Workspace</h2>
                    <p>
                      Use the switcher to jump between premium finance controls and freelance
                      operations.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div className={styles.rowMeta}>
                    Payments and subscriptions stay here. Escrow, accounts, and withdrawals also
                    have a dedicated freelance ops view.
                  </div>
                  <select
                    value={activeSection}
                    onChange={(event) => setActiveSection(event.target.value as SectionKey)}
                    style={{
                      minWidth: 220,
                      padding: '10px 12px',
                      borderRadius: 14,
                      border: '1px solid #CBD5E1',
                      background: '#fff',
                      color: '#0F172A',
                      font: 'inherit',
                    }}
                  >
                    <option value="finance">Finance</option>
                    <option value="freelance">Freelance Ops</option>
                  </select>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <MetricCard
                  title="Subscription revenue"
                  value={formatMoney(financeData?.summary?.totalRevenueBDT ?? 0)}
                  hint="Successful premium payments"
                  icon={BadgeDollarSign}
                />
                <MetricCard
                  title="Subscription refunds"
                  value={formatMoney(financeData?.summary?.refundedRevenueBDT ?? 0)}
                  hint="Returned premium value"
                  icon={RefreshCw}
                />
                <MetricCard
                  title="Subscriptions"
                  value={`${financeData?.summary?.activeSubscriptions ?? 0}`}
                  hint="Currently active"
                  icon={Crown}
                />
                <MetricCard
                  title="Premium users"
                  value={`${financeData?.summary?.premiumUserCount ?? 0}`}
                  hint="Access enabled"
                  icon={Users}
                />
                <MetricCard
                  title="Freelance GMV"
                  value={formatMoney(financeData?.summary?.freelanceGMVBDT ?? 0)}
                  hint="Escrow-funded order volume"
                  icon={BriefcaseBusiness}
                />
                <MetricCard
                  title="Escrow held"
                  value={formatMoney(financeData?.summary?.freelanceEscrowHeldBDT ?? 0)}
                  hint="Currently held by superadmin"
                  icon={ShieldCheck}
                />
                <MetricCard
                  title="Released payouts"
                  value={formatMoney(financeData?.summary?.freelanceReleasedBDT ?? 0)}
                  hint="Freelancer payouts completed"
                  icon={CheckCheck}
                />
                <MetricCard
                  title="Freelance disputes"
                  value={`${financeData?.summary?.disputedFreelanceOrders ?? 0}`}
                  hint="Orders needing admin attention"
                  icon={MessageSquareWarning}
                />
              </div>

              <div className={styles.financeGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Payments</h2>
                      <p>Update subscription and freelance payment records.</p>
                    </div>
                  </div>
                  <div className={styles.filters}>
                    <div className={styles.filterField}>
                      <label>Status</label>
                      <select
                        value={financeFilters.paymentStatus}
                        onChange={(event) =>
                          setFinanceFilters((current) => ({
                            ...current,
                            paymentStatus: event.target.value,
                          }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="success">Success</option>
                        <option value="initiated">Initiated</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Method</label>
                      <select
                        value={financeFilters.method}
                        onChange={(event) =>
                          setFinanceFilters((current) => ({
                            ...current,
                            method: event.target.value,
                          }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="bkash">bKash</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Type</label>
                      <select
                        value={financeFilters.type}
                        onChange={(event) =>
                          setFinanceFilters((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="subscription">Subscription</option>
                        <option value="freelance_escrow">Freelance escrow</option>
                        <option value="freelance_release">Freelance release</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Plan</label>
                      <select
                        value={financeFilters.plan}
                        onChange={(event) =>
                          setFinanceFilters((current) => ({ ...current, plan: event.target.value }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="student_premium">Student premium</option>
                        <option value="employer_premium">Employer premium</option>
                      </select>
                    </div>
                    <div className={styles.filterFieldWide}>
                      <label>Search</label>
                      <input
                        value={financeFilters.search}
                        onChange={(event) =>
                          setFinanceFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder="User or reference"
                      />
                    </div>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void loadFinance()}
                      type="button"
                    >
                      <Search size={14} />
                      Refresh finance
                    </button>
                  </div>

                  {financeLoading ? (
                    <div className={styles.loaderWrap}>
                      <LoaderCircle className={styles.spin} size={20} />
                    </div>
                  ) : financeData?.payments?.length ? (
                    <div className={styles.listTable}>
                      {financeData.payments.map((payment: any) => (
                        <div key={payment._id} className={styles.financeRow}>
                          <div>
                            <div className={styles.rowTitle}>
                              {labelFromMaybeUser(payment.userId)}
                            </div>
                            <div className={styles.rowMeta}>
                              {formatMoney(payment.amountBDT)} ·{' '}
                              {formatDate(payment.createdAt, true)}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                                marginTop: 8,
                              }}
                            >
                              <StatusBadge value={payment.status} />
                              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                {normalizeLabel(payment.type)}
                              </span>
                              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                {normalizeLabel(payment.method)}
                              </span>
                              {payment.referenceType ? (
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                  {normalizeLabel(payment.referenceType)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.financeControls}>
                            <select
                              value={paymentDrafts[payment._id]?.status ?? payment.status}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [payment._id]: {
                                    ...(current[payment._id] ?? {
                                      status: payment.status,
                                      method: payment.method,
                                    }),
                                    status: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="initiated">Initiated</option>
                              <option value="success">Success</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                            <select
                              value={paymentDrafts[payment._id]?.method ?? payment.method}
                              onChange={(event) =>
                                setPaymentDrafts((current) => ({
                                  ...current,
                                  [payment._id]: {
                                    ...(current[payment._id] ?? {
                                      status: payment.status,
                                      method: payment.method,
                                    }),
                                    method: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="bkash">bKash</option>
                              <option value="visa">Visa</option>
                              <option value="mastercard">Mastercard</option>
                            </select>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => void handleSavePayment(payment._id)}
                              type="button"
                              disabled={financeActionId === payment._id}
                            >
                              <Save size={14} />
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <SectionEmpty
                      title="No payments found"
                      description="Filtered payment records will appear here."
                    />
                  )}
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Subscriptions</h2>
                      <p>Adjust plan, status, and renewal window.</p>
                    </div>
                  </div>
                  {financeLoading ? (
                    <div className={styles.loaderWrap}>
                      <LoaderCircle className={styles.spin} size={20} />
                    </div>
                  ) : financeData?.subscriptions?.length ? (
                    <div className={styles.listTable}>
                      {financeData.subscriptions.map((subscription: any) => (
                        <div key={subscription._id} className={styles.financeRowTall}>
                          <div>
                            <div className={styles.rowTitle}>
                              {labelFromMaybeUser(subscription.userId)}
                            </div>
                            <div className={styles.rowMeta}>
                              {subscription.plan?.replace('_', ' ')} · ends{' '}
                              {formatDate(subscription.endDate)}
                            </div>
                          </div>
                          <div className={styles.subscriptionControls}>
                            <select
                              value={
                                subscriptionDrafts[subscription._id]?.plan ?? subscription.plan
                              }
                              onChange={(event) =>
                                setSubscriptionDrafts((current) => ({
                                  ...current,
                                  [subscription._id]: {
                                    ...(current[subscription._id] ?? {
                                      status: subscription.status,
                                      plan: subscription.plan,
                                      endDate: toDateInput(subscription.endDate),
                                      autoRenew: subscription.autoRenew,
                                    }),
                                    plan: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="student_premium">Student premium</option>
                              <option value="employer_premium">Employer premium</option>
                            </select>
                            <select
                              value={
                                subscriptionDrafts[subscription._id]?.status ?? subscription.status
                              }
                              onChange={(event) =>
                                setSubscriptionDrafts((current) => ({
                                  ...current,
                                  [subscription._id]: {
                                    ...(current[subscription._id] ?? {
                                      status: subscription.status,
                                      plan: subscription.plan,
                                      endDate: toDateInput(subscription.endDate),
                                      autoRenew: subscription.autoRenew,
                                    }),
                                    status: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="active">Active</option>
                              <option value="expired">Expired</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <input
                              type="date"
                              value={
                                subscriptionDrafts[subscription._id]?.endDate ??
                                toDateInput(subscription.endDate)
                              }
                              onChange={(event) =>
                                setSubscriptionDrafts((current) => ({
                                  ...current,
                                  [subscription._id]: {
                                    ...(current[subscription._id] ?? {
                                      status: subscription.status,
                                      plan: subscription.plan,
                                      endDate: toDateInput(subscription.endDate),
                                      autoRenew: subscription.autoRenew,
                                    }),
                                    endDate: event.target.value,
                                  },
                                }))
                              }
                            />
                            <button
                              className={styles.secondaryButton}
                              onClick={() => void handleSaveSubscription(subscription._id)}
                              type="button"
                              disabled={financeActionId === subscription._id}
                            >
                              <Save size={14} />
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <SectionEmpty
                      title="No subscriptions found"
                      description="Subscription records will appear here."
                    />
                  )}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Freelance Marketplace</h2>
                    <p>Moderate escrow orders and control freelance board visibility.</p>
                  </div>
                </div>
                <div className={styles.financeGrid}>
                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Escrow orders</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceOrders?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceOrders.map((order: any) => {
                          const busyPrefix = `freelance:${order._id}:`;
                          const actionBusy = financeActionId?.startsWith(busyPrefix);
                          return (
                            <div key={order._id} className={styles.financeRowTall}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={styles.rowTitle}>{order.listing.title}</div>
                                <div className={styles.rowMeta}>
                                  {order.client.companyName || order.client.name} →{' '}
                                  {order.freelancer.name} · {formatMoney(order.agreedPriceBDT)} ·
                                  Due {formatDate(order.dueDate)}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    marginTop: 8,
                                  }}
                                >
                                  <StatusBadge value={order.status} />
                                  <StatusBadge value={order.escrowStatus} />
                                  {order.paymentMethod ? (
                                    <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                      {normalizeLabel(order.paymentMethod)}
                                    </span>
                                  ) : null}
                                </div>
                                {order.adminNote ? (
                                  <div
                                    style={{
                                      marginTop: 10,
                                      fontSize: 12,
                                      color: '#0F172A',
                                      background: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: 10,
                                      padding: '8px 10px',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    <strong>Admin note:</strong> {order.adminNote}
                                  </div>
                                ) : null}
                              </div>
                              <div
                                style={{
                                  minWidth: 280,
                                  display: 'grid',
                                  gap: 8,
                                  alignContent: 'start',
                                }}
                              >
                                <input
                                  value={freelanceAdminNotes[order._id] ?? ''}
                                  onChange={(event) =>
                                    setFreelanceAdminNotes((current) => ({
                                      ...current,
                                      [order._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Admin note for both parties"
                                  style={{
                                    width: '100%',
                                    fontSize: 13,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #CBD5E1',
                                  }}
                                />
                                <div
                                  className={styles.actionRow}
                                  style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
                                >
                                  {order.escrowStatus === 'held' && order.status !== 'disputed' ? (
                                    <button
                                      className={styles.ghostButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'mark_disputed')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Dispute
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' && order.status === 'disputed' ? (
                                    <button
                                      className={styles.ghostButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(
                                          order._id,
                                          'restore_in_progress'
                                        )
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Restore
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' ? (
                                    <button
                                      className={styles.secondaryButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'release_escrow')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Release
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' ? (
                                    <button
                                      className={styles.dangerButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'refund_escrow')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Refund
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No freelance orders found"
                        description="Escrow orders matching the finance filters will appear here."
                      />
                    )}
                  </div>

                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Listings</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceListings?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceListings.map((listing: any) => (
                          <div key={listing._id} className={styles.listRow}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={styles.rowTitle}>{listing.title}</div>
                              <div className={styles.rowMeta}>
                                {listing.student.name} · {normalizeLabel(listing.category)} ·{' '}
                                {formatMoney(listing.priceBDT)} · {listing.deliveryDays} days
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  flexWrap: 'wrap',
                                  marginTop: 8,
                                }}
                              >
                                <StatusBadge value={listing.isActive ? 'active' : 'inactive'} />
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                  {listing.totalOrdersCompleted} completed
                                </span>
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                  {listing.averageRating.toFixed(1)} rating
                                </span>
                              </div>
                            </div>
                            <div className={styles.actionRow}>
                              <button
                                className={
                                  listing.isActive ? styles.dangerButton : styles.secondaryButton
                                }
                                onClick={() =>
                                  void handleToggleFreelanceListing(listing._id, !listing.isActive)
                                }
                                type="button"
                                disabled={freelanceListingActionId === listing._id}
                              >
                                {listing.isActive ? 'Pause' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No listings found"
                        description="Freelance services matching the current filters will appear here."
                      />
                    )}

                    <div className={styles.listTable}>
                      {[
                        {
                          label: 'Active listings',
                          value: `${financeData?.summary?.activeFreelanceListings ?? 0}`,
                        },
                        {
                          label: 'Verified freelancers',
                          value: `${financeData?.summary?.verifiedFreelancers ?? 0}`,
                        },
                        {
                          label: 'Refunded escrow',
                          value: formatMoney(financeData?.summary?.freelanceRefundedBDT ?? 0),
                        },
                      ].map((row) => (
                        <div key={row.label} className={styles.listRow}>
                          <div className={styles.rowTitle}>{row.label}</div>
                          <strong>{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'freelance' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Freelance Ops</h2>
                    <p>
                      Manage escrow, platform fees, marketplace visibility, account balances, and
                      withdrawal requests.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div className={styles.rowMeta}>
                    Superadmin holds freelance escrow, controls listing visibility, and reviews
                    payout withdrawals from here.
                  </div>
                  <select
                    value={activeSection}
                    onChange={(event) => setActiveSection(event.target.value as SectionKey)}
                    style={{
                      minWidth: 220,
                      padding: '10px 12px',
                      borderRadius: 14,
                      border: '1px solid #CBD5E1',
                      background: '#fff',
                      color: '#0F172A',
                      font: 'inherit',
                    }}
                  >
                    <option value="finance">Finance</option>
                    <option value="freelance">Freelance Ops</option>
                  </select>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <MetricCard
                  title="Freelance GMV"
                  value={formatMoney(financeData?.summary?.freelanceGMVBDT ?? 0)}
                  hint="Escrow-funded order volume"
                  icon={BriefcaseBusiness}
                />
                <MetricCard
                  title="Escrow held"
                  value={formatMoney(financeData?.summary?.freelanceEscrowHeldBDT ?? 0)}
                  hint="Currently protected by superadmin"
                  icon={ShieldCheck}
                />
                <MetricCard
                  title="Released payout"
                  value={formatMoney(financeData?.summary?.freelanceReleasedBDT ?? 0)}
                  hint="Net freelancer payouts completed"
                  icon={CheckCheck}
                />
                <MetricCard
                  title="Platform fees"
                  value={formatMoney(financeData?.summary?.freelancePlatformFeesCollectedBDT ?? 0)}
                  hint="15% retained from released freelance earnings"
                  icon={BadgeDollarSign}
                />
                <MetricCard
                  title="Balances"
                  value={formatMoney(financeData?.summary?.freelanceAccountBalancesBDT ?? 0)}
                  hint="Money currently sitting in freelancer accounts"
                  icon={Users}
                />
                <MetricCard
                  title="Withdrawn"
                  value={formatMoney(financeData?.summary?.freelanceWithdrawnBDT ?? 0)}
                  hint="Funds already moved out of accounts"
                  icon={RefreshCw}
                />
                <MetricCard
                  title="Pending withdrawals"
                  value={formatMoney(financeData?.summary?.pendingFreelanceWithdrawalsBDT ?? 0)}
                  hint="Withdrawal requests waiting for review"
                  icon={BellRing}
                />
                <MetricCard
                  title="Disputes"
                  value={`${financeData?.summary?.disputedFreelanceOrders ?? 0}`}
                  hint="Orders needing admin intervention"
                  icon={MessageSquareWarning}
                />
              </div>

              <div className={styles.financeGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Escrow Orders & Marketplace</h2>
                      <p>Review order state, hold notes, and listing visibility.</p>
                    </div>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void loadFinance()}
                      type="button"
                    >
                      <RefreshCw size={14} />
                      Refresh ops
                    </button>
                  </div>
                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Escrow orders</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceOrders?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceOrders.map((order: any) => {
                          const busyPrefix = `freelance:${order._id}:`;
                          const actionBusy = financeActionId?.startsWith(busyPrefix);
                          return (
                            <div key={order._id} className={styles.financeRowTall}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={styles.rowTitle}>{order.listing.title}</div>
                                <div className={styles.rowMeta}>
                                  {order.client.companyName || order.client.name} →{' '}
                                  {order.freelancer.name} · {formatMoney(order.agreedPriceBDT)}{' '}
                                  gross · {formatMoney(order.freelancerPayoutBDT)} payout ·{' '}
                                  {formatMoney(order.nexternCutBDT)} fee
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    marginTop: 8,
                                  }}
                                >
                                  <StatusBadge value={order.proposalStatus} />
                                  <StatusBadge value={order.status} />
                                  <StatusBadge value={order.escrowStatus} />
                                  {order.paymentMethod ? (
                                    <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                      {normalizeLabel(order.paymentMethod)}
                                    </span>
                                  ) : null}
                                </div>
                                <div className={styles.rowMeta} style={{ marginTop: 8 }}>
                                  Due {formatDate(order.dueDate)} · Updated admin note is visible to
                                  both sides
                                </div>
                              </div>
                              <div
                                style={{
                                  minWidth: 280,
                                  display: 'grid',
                                  gap: 8,
                                  alignContent: 'start',
                                }}
                              >
                                <input
                                  value={freelanceAdminNotes[order._id] ?? ''}
                                  onChange={(event) =>
                                    setFreelanceAdminNotes((current) => ({
                                      ...current,
                                      [order._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Admin note for both parties"
                                  style={{
                                    width: '100%',
                                    fontSize: 13,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #CBD5E1',
                                  }}
                                />
                                <div
                                  className={styles.actionRow}
                                  style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
                                >
                                  {order.escrowStatus === 'held' && order.status !== 'disputed' ? (
                                    <button
                                      className={styles.ghostButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'mark_disputed')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Dispute
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' && order.status === 'disputed' ? (
                                    <button
                                      className={styles.ghostButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(
                                          order._id,
                                          'restore_in_progress'
                                        )
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Restore
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' ? (
                                    <button
                                      className={styles.secondaryButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'release_escrow')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Release
                                    </button>
                                  ) : null}
                                  {order.escrowStatus === 'held' ? (
                                    <button
                                      className={styles.dangerButton}
                                      onClick={() =>
                                        void handleFreelanceOrderAction(order._id, 'refund_escrow')
                                      }
                                      type="button"
                                      disabled={actionBusy}
                                    >
                                      Refund
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No freelance orders found"
                        description="Escrow-backed freelance orders will appear here."
                      />
                    )}
                  </div>

                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Marketplace listings</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceListings?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceListings.map((listing: any) => (
                          <div key={listing._id} className={styles.listRow}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={styles.rowTitle}>{listing.title}</div>
                              <div className={styles.rowMeta}>
                                {listing.student.name} · {normalizeLabel(listing.category)} ·{' '}
                                {formatMoney(listing.priceBDT)} · {listing.deliveryDays} days
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  flexWrap: 'wrap',
                                  marginTop: 8,
                                }}
                              >
                                <StatusBadge value={listing.isActive ? 'active' : 'inactive'} />
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                  {listing.totalOrdersCompleted} completed
                                </span>
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                  {listing.averageRating.toFixed(1)} rating
                                </span>
                              </div>
                            </div>
                            <div className={styles.actionRow}>
                              <button
                                className={
                                  listing.isActive ? styles.dangerButton : styles.secondaryButton
                                }
                                onClick={() =>
                                  void handleToggleFreelanceListing(listing._id, !listing.isActive)
                                }
                                type="button"
                                disabled={freelanceListingActionId === listing._id}
                              >
                                {listing.isActive ? 'Pause' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No listings found"
                        description="Freelance marketplace listings will appear here."
                      />
                    )}
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Accounts & Withdrawals</h2>
                      <p>
                        Review freelancer balances, lifetime metrics, and pending payout requests.
                      </p>
                    </div>
                  </div>

                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Freelancer accounts</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceAccounts?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceAccounts.map((user: any) => (
                          <div key={user._id} className={styles.listRow}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={styles.rowTitle}>{user.companyName || user.name}</div>
                              <div className={styles.rowMeta}>
                                {user.email || 'No email'} · {roleLabel(user.role)} ·{' '}
                                {user.university || 'N/A'}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 10,
                                minWidth: 320,
                              }}
                            >
                              <div>
                                <div className={styles.rowMeta}>Balance</div>
                                <div className={styles.rowTitle}>
                                  {formatMoney(user.freelanceAccountBalanceBDT)}
                                </div>
                              </div>
                              <div>
                                <div className={styles.rowMeta}>Earnings</div>
                                <div className={styles.rowTitle}>
                                  {formatMoney(user.freelanceTotalEarningsBDT)}
                                </div>
                              </div>
                              <div>
                                <div className={styles.rowMeta}>Withdrawn</div>
                                <div className={styles.rowTitle}>
                                  {formatMoney(user.freelanceTotalWithdrawnBDT)}
                                </div>
                              </div>
                              <div>
                                <div className={styles.rowMeta}>Fees</div>
                                <div className={styles.rowTitle}>
                                  {formatMoney(user.freelanceTotalPlatformFeesBDT)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No account balances"
                        description="Released payouts and user freelance account balances will appear here."
                      />
                    )}
                  </div>

                  <div className={styles.panelSubsection}>
                    <div className={styles.subsectionTitle}>Withdrawal requests</div>
                    {financeLoading ? (
                      <div className={styles.loaderWrap}>
                        <LoaderCircle className={styles.spin} size={20} />
                      </div>
                    ) : financeData?.freelanceWithdrawals?.length ? (
                      <div className={styles.listTable}>
                        {financeData.freelanceWithdrawals.map((withdrawal: any) => {
                          const processBusy =
                            financeActionId === `withdrawal:${withdrawal._id}:process`;
                          const rejectBusy =
                            financeActionId === `withdrawal:${withdrawal._id}:reject`;
                          return (
                            <div key={withdrawal._id} className={styles.financeRowTall}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={styles.rowTitle}>
                                  {withdrawal.user.companyName || withdrawal.user.name}
                                </div>
                                <div className={styles.rowMeta}>
                                  {formatMoney(withdrawal.amountBDT)} · Requested{' '}
                                  {formatDate(withdrawal.createdAt, true)} · Balance after request{' '}
                                  {formatMoney(withdrawal.accountBalanceAfterBDT)}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    marginTop: 8,
                                  }}
                                >
                                  <StatusBadge value={withdrawal.status} />
                                </div>
                              </div>
                              <div className={styles.actionRow} style={{ flexWrap: 'wrap' }}>
                                {withdrawal.status === 'requested' ? (
                                  <>
                                    <button
                                      className={styles.secondaryButton}
                                      onClick={() =>
                                        void handleFreelanceWithdrawalAction(
                                          withdrawal._id,
                                          'process'
                                        )
                                      }
                                      type="button"
                                      disabled={processBusy || rejectBusy}
                                    >
                                      Process
                                    </button>
                                    <button
                                      className={styles.dangerButton}
                                      onClick={() =>
                                        void handleFreelanceWithdrawalAction(
                                          withdrawal._id,
                                          'reject'
                                        )
                                      }
                                      type="button"
                                      disabled={processBusy || rejectBusy}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <SectionEmpty
                        title="No withdrawals"
                        description="Requested and processed freelance withdrawals will appear here."
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'support' ? (
            <section className={styles.section}>
              <div className={styles.supportGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Send support notification</h2>
                      <p>Push an admin note to a specific user.</p>
                    </div>
                  </div>
                  <form className={styles.formGrid} onSubmit={handleSupportSubmit}>
                    <div className={styles.filterField}>
                      <label>User ID</label>
                      <input
                        value={supportComposer.userId}
                        onChange={(event) =>
                          setSupportComposer((current) => ({
                            ...current,
                            userId: event.target.value,
                          }))
                        }
                        placeholder="Paste user id"
                        required
                      />
                    </div>
                    <div className={styles.filterField}>
                      <label>Type</label>
                      <select
                        value={supportComposer.type}
                        onChange={(event) =>
                          setSupportComposer((current) => ({
                            ...current,
                            type: event.target.value,
                          }))
                        }
                      >
                        <option value="status_update">Status update</option>
                        <option value="message_received">Message received</option>
                        <option value="advisor_note">Advisor note</option>
                        <option value="payment_received">Payment received</option>
                        <option value="job_match">Job match</option>
                        <option value="badge_earned">Badge earned</option>
                      </select>
                    </div>
                    <div className={styles.filterFieldWide}>
                      <label>Title</label>
                      <input
                        value={supportComposer.title}
                        onChange={(event) =>
                          setSupportComposer((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Short title"
                        required
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Message</label>
                      <textarea
                        rows={4}
                        value={supportComposer.body}
                        onChange={(event) =>
                          setSupportComposer((current) => ({
                            ...current,
                            body: event.target.value,
                          }))
                        }
                        placeholder="Explain the support update"
                        required
                      />
                    </div>
                    <div className={styles.filterFieldFull}>
                      <label>Link</label>
                      <input
                        value={supportComposer.link}
                        onChange={(event) =>
                          setSupportComposer((current) => ({
                            ...current,
                            link: event.target.value,
                          }))
                        }
                        placeholder="/student/applications"
                      />
                    </div>
                    <button
                      className={styles.primaryButton}
                      type="submit"
                      disabled={supportActionId === 'send'}
                    >
                      {supportActionId === 'send' ? (
                        <LoaderCircle className={styles.spin} size={14} />
                      ) : (
                        <BellRing size={14} />
                      )}
                      Send notification
                    </button>
                  </form>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Moderation feed</h2>
                      <p>Flagged conversations and recent notifications.</p>
                    </div>
                  </div>
                  <div className={styles.filters}>
                    <div className={styles.filterField}>
                      <label>Messages</label>
                      <select
                        value={supportFilters.flaggedOnly}
                        onChange={(event) =>
                          setSupportFilters((current) => ({
                            ...current,
                            flaggedOnly: event.target.value,
                          }))
                        }
                      >
                        <option value="true">Flagged only</option>
                        <option value="false">Unflagged only</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div className={styles.filterField}>
                      <label>Notifications</label>
                      <select
                        value={supportFilters.unreadOnly}
                        onChange={(event) =>
                          setSupportFilters((current) => ({
                            ...current,
                            unreadOnly: event.target.value,
                          }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="true">Unread only</option>
                      </select>
                    </div>
                    <div className={styles.filterFieldWide}>
                      <label>Search</label>
                      <input
                        value={supportFilters.search}
                        onChange={(event) =>
                          setSupportFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder="Content, title, sender, receiver"
                      />
                    </div>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void loadSupport()}
                      type="button"
                    >
                      <Search size={14} />
                      Refresh feed
                    </button>
                  </div>

                  {supportLoading ? (
                    <div className={styles.loaderWrap}>
                      <LoaderCircle className={styles.spin} size={20} />
                    </div>
                  ) : (
                    <div className={styles.supportFeeds}>
                      <div className={styles.panelSubsection}>
                        <div className={styles.subsectionTitle}>Messages</div>
                        {supportData?.messages?.length ? (
                          <div className={styles.listTable}>
                            {supportData.messages.map((message: any) => (
                              <div key={message._id} className={styles.supportItem}>
                                <div>
                                  <div className={styles.rowTitle}>
                                    {labelFromMaybeUser(message.senderId)} →{' '}
                                    {labelFromMaybeUser(message.receiverId)}
                                  </div>
                                  <div className={styles.supportMessage}>{message.content}</div>
                                  <div className={styles.rowMeta}>
                                    {formatDate(message.createdAt, true)}
                                  </div>
                                </div>
                                <div className={styles.supportControls}>
                                  <input
                                    value={
                                      messageReasonDrafts[message._id] ?? message.flagReason ?? ''
                                    }
                                    onChange={(event) =>
                                      setMessageReasonDrafts((current) => ({
                                        ...current,
                                        [message._id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Flag reason"
                                  />
                                  <button
                                    className={styles.secondaryButton}
                                    onClick={() =>
                                      void handleModerateMessage(message._id, !message.isFlagged)
                                    }
                                    type="button"
                                    disabled={supportActionId === message._id}
                                  >
                                    {message.isFlagged ? 'Restore' : 'Flag'}
                                  </button>
                                  <button
                                    className={styles.ghostButton}
                                    onClick={() =>
                                      openSupportForUser(idFromMaybeObject(message.receiverId))
                                    }
                                    type="button"
                                  >
                                    Notify receiver
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <SectionEmpty
                            title="No messages"
                            description="No messages match the moderation filters."
                          />
                        )}
                      </div>
                      <div className={styles.panelSubsection}>
                        <div className={styles.subsectionTitle}>Latest notifications</div>
                        {supportData?.notifications?.length ? (
                          <div className={styles.listTable}>
                            {supportData.notifications.map((notification: any) => (
                              <div key={notification._id} className={styles.listRow}>
                                <div>
                                  <div className={styles.rowTitle}>{notification.title}</div>
                                  <div className={styles.rowMeta}>
                                    {labelFromMaybeUser(notification.userId)} ·{' '}
                                    {formatDate(notification.createdAt, true)}
                                  </div>
                                  <div className={styles.supportMessage}>{notification.body}</div>
                                </div>
                                <StatusBadge value={notification.isRead ? 'read' : 'unread'} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <SectionEmpty
                            title="No notifications"
                            description="Recent notifications will appear here."
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'messages' ? (
            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2>Platform Messages</h2>
                    <p>Monitor, moderate, and manage cross-platform communications.</p>
                  </div>
                </div>
                <div className={styles.filters}>
                  <div className={styles.filterField}>
                    <label>Status</label>
                    <select
                      value={messagesFilters.flaggedOnly}
                      onChange={(event) =>
                        setMessagesFilters((current) => ({
                          ...current,
                          flaggedOnly: event.target.value,
                        }))
                      }
                    >
                      <option value="all">All Messages</option>
                      <option value="true">Flagged Only</option>
                      <option value="false">Unflagged Only</option>
                    </select>
                  </div>
                  <div className={styles.filterFieldWide}>
                    <label>Search</label>
                    <input
                      value={messagesFilters.search}
                      onChange={(event) =>
                        setMessagesFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                      placeholder="Search content, sender, receiver, reason"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                    <button
                      className={styles.primaryButton}
                      onClick={() => void loadMessages()}
                      type="button"
                      style={{ width: '100%', padding: '10px 14px' }}
                    >
                      <Search size={14} />
                      Refresh
                    </button>
                  </div>
                </div>

                {messagesLoading ? (
                  <div className={styles.loaderWrap}>
                    <LoaderCircle className={styles.spin} size={20} />
                  </div>
                ) : (
                  <>
                    {messagesData?.summary && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 16,
                          padding: '0 24px 20px',
                          borderBottom: '1px solid #E2E8F0',
                          marginBottom: 20,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Total Messages
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: '#0F172A',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {formatCompactNumber(messagesData.summary.totalMessages)}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Flagged Alerts
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: '#9F1239',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {formatCompactNumber(messagesData.summary.flaggedMessages)}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#64748B',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              marginBottom: 4,
                            }}
                          >
                            Sent Today
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: '#166534',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {formatCompactNumber(messagesData.summary.messagesToday)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={styles.listTable}>
                      {messagesData?.messages?.length ? (
                        messagesData.messages.map((message: any) => (
                          <div key={message._id} className={styles.listRow}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                className={styles.rowTitle}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                              >
                                {labelFromMaybeUser(message.senderId)} →{' '}
                                {labelFromMaybeUser(message.receiverId)}
                                {message.isFlagged && <StatusBadge value="rejected" />}
                                {message.isDeletedForEveryone && <StatusBadge value="withdrawn" />}
                              </div>
                              <div className={styles.rowMeta}>
                                {formatDate(message.createdAt, true)}
                                {message.relatedJobId
                                  ? ` · Job: ${message.relatedJobId.title}`
                                  : ''}
                              </div>
                              <div className={styles.supportMessage} style={{ marginTop: 8 }}>
                                {message.content}
                              </div>
                              {message.isFlagged && message.flagReason && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#9F1239',
                                    background: '#FFF1F2',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    display: 'inline-block',
                                  }}
                                >
                                  <strong>Flag Reason:</strong> {message.flagReason}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                alignItems: 'flex-end',
                                marginLeft: 16,
                              }}
                            >
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                  value={
                                    messageReasonDrafts[message._id] ?? message.flagReason ?? ''
                                  }
                                  onChange={(event) =>
                                    setMessageReasonDrafts((current) => ({
                                      ...current,
                                      [message._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Flag reason"
                                  style={{
                                    width: 140,
                                    fontSize: 13,
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #E2E8F0',
                                  }}
                                />
                                <button
                                  className={
                                    message.isFlagged ? styles.ghostButton : styles.secondaryButton
                                  }
                                  onClick={() =>
                                    handleToggleFlagMessage(message._id, !message.isFlagged)
                                  }
                                  type="button"
                                  disabled={messagesActionId === message._id}
                                  style={{ width: 80 }}
                                >
                                  {message.isFlagged ? 'Unflag' : 'Flag'}
                                </button>
                              </div>
                              {!message.isDeletedForEveryone && (
                                <button
                                  className={styles.ghostButton}
                                  onClick={() => handleDeleteMessage(message._id)}
                                  type="button"
                                  disabled={messagesActionId === message._id}
                                  style={{ color: '#E11D48', width: 80 }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <SectionEmpty
                          title="No messages found"
                          description="Try adjusting your filters or search query."
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          ) : null}

          {activeSection === 'analytics' ? (
            <section className={styles.section}>
              <div className={styles.rangeTabs}>
                {['7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    className={`${styles.rangeButton} ${overviewRange === range ? styles.rangeButtonActive : ''}`}
                    onClick={() => setOverviewRange(range)}
                    type="button"
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className={styles.chartGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>User signups</h2>
                      <p>Account creation over time.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrap}>
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                      initialDimension={{ width: 800, height: 280 }}
                    >
                      <AreaChart data={overview?.activity?.users ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                        <XAxis dataKey="label" tick={{ fill: '#5b6b81', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#5b6b81', fontSize: 12 }} />
                        <Tooltip />
                        <Area dataKey="value" stroke="#0f766e" fill="#99f6e4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2>Application status mix</h2>
                      <p>Current pipeline distribution.</p>
                    </div>
                  </div>
                  <div className={styles.chartWrapSmall}>
                    <ResponsiveContainer
                      width="100%"
                      height={260}
                      initialDimension={{ width: 800, height: 260 }}
                    >
                      <BarChart
                        data={(overview?.breakdowns?.applicationStatuses ?? []).map((row: any) => ({
                          label: normalizeLabel(row._id),
                          value: row.value,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                        <XAxis dataKey="label" tick={{ fill: '#5b6b81', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#5b6b81', fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#c2410c" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {/* General Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '32px 36px',
              maxWidth: 400,
              width: '90vw',
              boxShadow: '0 24px 80px rgba(15,23,42,0.22)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#BE123C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CircleAlert size={28} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: 8,
              }}
            >
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
              {confirmModal.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={confirmModal.onConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
