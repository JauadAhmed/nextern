'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ALUMNI_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/lib/student-navigation';

type UserProps = {
  name: string;
  email: string;
  image?: string;
  userId: string;
  role?: string;
  opportunityScore: number;
  profileCompleteness: number;
  unreadNotifications: number;
  unreadMessages: number;
};

type StudentPageShellProps = {
  user: UserProps;
  children: ReactNode;
};

const PAGE_LEVEL_SHELL_PREFIXES = [
  '/student/dashboard',
  '/student/jobs',
  '/student/applications',
  '/student/skills',
  '/student/assessments',
  '/student/interviews',
  '/student/calendar',
  '/student/freelance',
  '/student/messages',
  '/student/badges',
  '/student/subscription',
  '/student/premium',
  '/student/mock-interview',
];

function hasPageLevelShell(pathname: string) {
  return PAGE_LEVEL_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function StudentPageShell({ user, children }: StudentPageShellProps) {
  const pathname = usePathname();
  const isMentor = user.role === 'alumni';

  if (!pathname?.startsWith('/student') || hasPageLevelShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      role={isMentor ? 'alumni' : 'student'}
      roleLabel={isMentor ? 'Mentor dashboard' : 'Student dashboard'}
      homeHref={isMentor ? '/student/mentorship/dashboard' : '/student/dashboard'}
      navItems={isMentor ? ALUMNI_NAV_ITEMS : STUDENT_NAV_ITEMS}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        userId: user.userId,
        subtitle: isMentor ? 'Mentor workspace' : 'Student workspace',
        unreadNotifications: user.unreadNotifications,
        unreadMessages: user.unreadMessages,
      }}
    >
      {children}
    </DashboardShell>
  );
}
