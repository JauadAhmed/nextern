'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import NotificationBell from '@/components/notifications/NotificationBell';
import MessageBell from '@/components/messaging/MessageBell';
import { readJsonSafely } from '@/lib/safe-json';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from 'lucide-react';

type IconName =
  | 'dashboard'
  | 'briefcase'
  | 'users'
  | 'building'
  | 'graduation'
  | 'calendar'
  | 'file'
  | 'insights'
  | 'target'
  | 'sparkles'
  | 'messages'
  | 'book'
  | 'shield'
  | 'star';

export type DashboardNavItem = {
  label: string;
  href?: string;
  icon?: IconName;
  items?: {
    label: string;
    href: string;
    description: string;
    icon: IconName;
  }[];
};

type DashboardRole = 'student' | 'employer' | 'advisor' | 'departmentHead' | 'alumni';
type DashboardSubItem = NonNullable<DashboardNavItem['items']>[number];

const profileConfig: Record<
  DashboardRole,
  { label: string; href: string; icon: 'users' | 'building' }
> = {
  student: { label: 'My Profile', href: '/student/profile', icon: 'users' },
  employer: { label: 'Company Profile', href: '/employer/profile', icon: 'building' },
  advisor: { label: 'My Profile', href: '/advisor/profile', icon: 'users' },
  departmentHead: { label: 'My Profile', href: '/dept/profile', icon: 'users' },
  alumni: { label: 'My Profile', href: '/student/mentorship/dashboard?tab=profile', icon: 'users' },
};

type DashboardShellProps = {
  role: DashboardRole;
  roleLabel: string;
  homeHref: string;
  navItems: DashboardNavItem[];
  user: {
    name: string;
    email: string;
    image?: string;
    subtitle: string;
    isPremium?: boolean;
    unreadNotifications: number;
    unreadMessages: number;
    userId?: string;
  };
  children: ReactNode;
  hideFooter?: boolean;
};

const iconMap = {
  dashboard: LayoutDashboard,
  briefcase: BriefcaseBusiness,
  users: Users,
  building: Building2,
  graduation: GraduationCap,
  calendar: CalendarDays,
  file: FileText,
  insights: LineChart,
  target: Target,
  sparkles: Sparkles,
  messages: MessageSquare,
  book: BookOpen,
  shield: ShieldCheck,
  star: Star,
};

function NavIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon size={size} strokeWidth={1.9} />;
}

function StaticChip({
  label,
  value,
  icon,
  compact = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 0 : 8,
        minWidth: compact ? 40 : undefined,
        minHeight: compact ? 40 : undefined,
        padding: compact ? '0' : '9px 12px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.05)',
        color: '#D8E3F1',
        fontSize: 12,
        fontWeight: 700,
      }}
      aria-label={label}
    >
      <span style={{ display: 'inline-flex', color: '#22D3EE' }}>{icon}</span>
      {!compact && <span>{label}</span>}
      {value > 0 && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: 10,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: compact ? '0 5px' : '0 4px',
            position: compact ? 'absolute' : 'static',
            top: compact ? -2 : undefined,
            right: compact ? -2 : undefined,
          }}
        >
          {value > 99 ? '99+' : value}
        </span>
      )}
    </div>
  );
}

function AccountMenuIcon({ icon }: { icon: 'building' | 'shield' | 'users' }) {
  if (icon === 'building') {
    return <Building2 size={15} strokeWidth={2} />;
  }

  if (icon === 'shield') {
    return <ShieldCheck size={15} strokeWidth={2} />;
  }

  return <Users size={15} strokeWidth={2} />;
}

function isPathMatch(pathname: string | null, href?: string) {
  if (!pathname || !href) return false;
  const normalized = href.split('#')[0].split('?')[0];
  return normalized === pathname && !href.includes('#');
}

const PREMIUM_STATUS_EVENT = 'nextern-premium-status-updated';

export default function DashboardShell({
  role,
  roleLabel,
  homeHref,
  navItems,
  user,
  children,
  hideFooter = false,
}: DashboardShellProps) {
  const profile = profileConfig[role];
  const profileMenuItems =
    role === 'student'
      ? [
          {
            href: profile.href,
            label: profile.label,
            description: 'View and edit your profile',
            icon: profile.icon,
          },
          {
            href: '/student/badges',
            label: 'Badges',
            description: 'See your earned badges and progress',
            icon: 'shield' as const,
          },
        ]
      : role === 'employer'
        ? [
            {
              href: profile.href,
              label: profile.label,
              description: 'View and edit your profile',
              icon: profile.icon,
            },
            {
              href: '/employer/badges',
              label: 'Badges',
              description: 'See your earned badges and trust signals',
              icon: 'shield' as const,
            },
          ]
        : role === 'advisor'
          ? [
              {
                href: profile.href,
                label: profile.label,
                description: 'View and edit your profile',
                icon: profile.icon,
              },
              {
                href: '/advisor/badges',
                label: 'Badges',
                description: 'See your earned badges and progress',
                icon: 'shield' as const,
              },
            ]
          : role === 'departmentHead'
            ? [
                {
                  href: profile.href,
                  label: profile.label,
                  description: 'View and edit your profile',
                  icon: profile.icon,
                },
                {
                  href: '/dept/badges',
                  label: 'Badges',
                  description: 'See your earned badges and leadership milestones',
                  icon: 'shield' as const,
                },
              ]
            : [
                {
                  href: profile.href,
                  label: profile.label,
                  description: 'View and edit your profile',
                  icon: profile.icon,
                },
              ];

  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const resolvedNavItems =
    role === 'student' ? STUDENT_NAV_ITEMS : role === 'employer' ? EMPLOYER_NAV_ITEMS : navItems;
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(
    () =>
      resolvedNavItems.find((item) =>
        item.items?.some((entry) => isPathMatch(pathname, entry.href))
      )?.label ?? null
  );
  const [premiumActive, setPremiumActive] = useState(Boolean(user.isPremium));

  const notificationsHref =
    role === 'student' || role === 'alumni'
      ? '/student/notifications'
      : role === 'employer'
        ? '/employer/notifications'
        : role === 'advisor'
          ? '/advisor/notifications'
          : '/dept/notifications';

  const messagesHref =
    role === 'student' || role === 'alumni'
      ? '/student/messages'
      : role === 'employer'
        ? '/employer/messages'
        : role === 'advisor'
          ? '/advisor/messages'
          : '/dept/messages';

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActiveHref = useMemo(() => (href?: string) => isPathMatch(pathname, href), [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setDesktopDropdown(null);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (role !== 'student' && role !== 'employer') return;
    let cancelled = false;

    async function loadPremiumStatus() {
      try {
        const res = await fetch('/api/premium/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await readJsonSafely<{ isPremium?: boolean }>(res, {});
        if (!cancelled && typeof data.isPremium === 'boolean') {
          setPremiumActive(data.isPremium);
        }
      } catch {
        /* keep shell stable */
      }
    }

    loadPremiumStatus();

    function handlePremiumUpdate(event: Event) {
      const customEvent = event as CustomEvent<{ isPremium?: boolean }>;
      if (typeof customEvent.detail?.isPremium === 'boolean') {
        setPremiumActive(customEvent.detail.isPremium);
      }
    }

    window.addEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate as EventListener);
    };
  }, [role]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileNavOpen]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign('/');
  }

  function renderDesktopLink(item: DashboardNavItem) {
    const hasActiveChild = item.items?.some((entry) => isActiveHref(entry.href)) ?? false;
    const active = isActiveHref(item.href) || hasActiveChild || desktopDropdown === item.label;

    if (!item.items) {
      return (
        <Link
          href={item.href ?? homeHref}
          onClick={() => setDesktopDropdown(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '15px 12px',
            textDecoration: 'none',
            color: active ? '#FFFFFF' : '#CBD5E1',
            fontSize: 14,
            fontWeight: active ? 700 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          {item.icon && <NavIcon name={item.icon} />}
          {item.label}
        </Link>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() =>
            setDesktopDropdown((current) => (current === item.label ? null : item.label))
          }
          aria-expanded={desktopDropdown === item.label}
          aria-haspopup="menu"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '15px 12px',
            border: 'none',
            background: 'transparent',
            color: active ? '#FFFFFF' : '#CBD5E1',
            fontSize: 14,
            fontWeight: active ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {item.icon && <NavIcon name={item.icon} />}
          {item.label}
          <ChevronDown
            size={14}
            style={{
              transform: desktopDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {desktopDropdown === item.label && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 110,
              width: 'min(320px, calc(100vw - 24px))',
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #D9E2EC',
              boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
              padding: 10,
            }}
          >
            {item.items.map((entry) => (
              <Link
                key={`${item.label}:${entry.label}:${entry.href}`}
                href={entry.href}
                onClick={() => setDesktopDropdown(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '11px 12px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#1E293B',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <NavIcon name={entry.icon} size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#1E293B',
                      marginBottom: 3,
                    }}
                  >
                    {entry.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
                    {entry.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderMobilePrimaryLink(item: DashboardNavItem) {
    const hasActiveChild = item.items?.some((entry) => isActiveHref(entry.href)) ?? false;
    const active = isActiveHref(item.href) || hasActiveChild;

    if (!item.items) {
      return (
        <Link
          href={item.href ?? homeHref}
          className={`dashboard-shell-mobile-link ${active ? 'is-active' : ''}`}
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="dashboard-shell-mobile-link-main">
            {item.icon && <NavIcon name={item.icon} />}
            <span>{item.label}</span>
          </span>
          <ChevronRight size={16} />
        </Link>
      );
    }

    return (
      <div
        className={`dashboard-shell-mobile-group ${mobileExpandedGroup === item.label ? 'is-open' : ''}`}
      >
        <button
          type="button"
          className={`dashboard-shell-mobile-link ${active ? 'is-active' : ''}`}
          onClick={() =>
            setMobileExpandedGroup((current) => (current === item.label ? null : item.label))
          }
          aria-expanded={mobileExpandedGroup === item.label}
        >
          <span className="dashboard-shell-mobile-link-main">
            {item.icon && <NavIcon name={item.icon} />}
            <span>{item.label}</span>
          </span>
          <ChevronDown
            size={16}
            style={{
              transform: mobileExpandedGroup === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {mobileExpandedGroup === item.label && (
          <div className="dashboard-shell-mobile-group-items">
            {item.items.map((entry) => renderMobileChildLink(item.label, entry))}
          </div>
        )}
      </div>
    );
  }

  function renderMobileChildLink(groupLabel: string, entry: DashboardSubItem) {
    const active = isActiveHref(entry.href);

    return (
      <Link
        key={`${groupLabel}:${entry.label}:${entry.href}`}
        href={entry.href}
        className={`dashboard-shell-mobile-child-link ${active ? 'is-active' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      >
        <div className="dashboard-shell-mobile-child-icon">
          <NavIcon name={entry.icon} size={15} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="dashboard-shell-mobile-child-title">{entry.label}</div>
          <div className="dashboard-shell-mobile-child-description">{entry.description}</div>
        </div>
      </Link>
    );
  }

  return (
    <div
      ref={shellRef}
      style={{
        height: hideFooter ? '100vh' : undefined,
        minHeight: hideFooter ? undefined : '100vh',
        overflow: hideFooter ? 'hidden' : undefined,
        display: hideFooter ? 'flex' : undefined,
        flexDirection: hideFooter ? 'column' : undefined,
        background: '#F1F5F9',
        color: '#1E293B',
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          boxShadow: '0 18px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div className="dashboard-shell-desktop">
          <div
            style={{
              background: '#172033',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                maxWidth: 1320,
                margin: '0 auto',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 18,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Link
                  href={homeHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 11,
                    textDecoration: 'none',
                  }}
                >
                  <NexternLogo
                    markSize={40}
                    markRadius={14}
                    markShadow="0 12px 24px rgba(34,211,238,0.2)"
                    textSize={20}
                    textColor="#FFFFFF"
                    subtitle={roleLabel}
                    subtitleColor="#9FB4D0"
                  />
                </Link>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: 'rgba(37,99,235,0.14)',
                    border: '1px solid rgba(34,211,238,0.24)',
                    color: '#E2E8F0',
                    maxWidth: 360,
                  }}
                >
                  <ShieldCheck size={14} color="#22D3EE" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.subtitle}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {user.userId ? (
                  <MessageBell
                    userId={user.userId}
                    initialUnread={user.unreadMessages}
                    href={messagesHref}
                  />
                ) : (
                  <StaticChip
                    label="Messages"
                    value={user.unreadMessages}
                    icon={<Mail size={14} strokeWidth={2} />}
                  />
                )}

                {user.userId ? (
                  <NotificationBell
                    userId={user.userId}
                    initialUnread={user.unreadNotifications}
                    notificationsHref={notificationsHref}
                  />
                ) : (
                  <StaticChip
                    label="Notifications"
                    value={user.unreadNotifications}
                    icon={<span style={{ fontSize: 14 }}>🔔</span>}
                  />
                )}

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((current) => !current)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="dashboard-account-menu"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px 6px 6px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: userMenuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      color: '#E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.2,
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#9FB4D0',
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </div>
                      {premiumActive && (
                        <div
                          style={{ color: '#FDE68A', fontSize: 11, fontWeight: 700, marginTop: 2 }}
                        >
                          Premium active
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      color="#9FB4D0"
                      style={{
                        transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      id="dashboard-account-menu"
                      role="menu"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 10px)',
                        zIndex: 120,
                        width: 'min(248px, calc(100vw - 24px))',
                        background: '#FFFFFF',
                        border: '1px solid #D9E2EC',
                        borderRadius: 20,
                        boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
                        padding: 10,
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 12px 14px',
                          borderBottom: '1px solid #E2E8F0',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          {user.email}
                        </div>
                      </div>

                      {profileMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '11px 12px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: '#1E293B',
                            marginBottom: 6,
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = '#F1F5F9';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 10,
                              background: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <AccountMenuIcon icon={item.icon} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      ))}

                      <button
                        onClick={handleSignOut}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 12px',
                          borderRadius: 12,
                          border: 'none',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} strokeWidth={2} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                maxWidth: 1320,
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
              className="dashboard-shell-nav"
            >
              {resolvedNavItems.map((item) => (
                <div key={item.label} style={{ position: 'relative' }}>
                  {renderDesktopLink(item)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-shell-mobile">
          <div className="dashboard-shell-mobile-bar">
            <button
              type="button"
              className="dashboard-shell-mobile-icon-button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-navigation"
            >
              <Menu size={18} />
            </button>

            <Link href={homeHref} className="dashboard-shell-mobile-brand">
              <NexternLogo
                markSize={32}
                markRadius={12}
                gap={8}
                textSize={18}
                textColor="#FFFFFF"
                subtitle={undefined}
              />
            </Link>

            <div className="dashboard-shell-mobile-actions">
              {user.userId ? (
                <MessageBell
                  userId={user.userId}
                  initialUnread={user.unreadMessages}
                  href={messagesHref}
                  compact
                />
              ) : (
                <StaticChip
                  label="Messages"
                  value={user.unreadMessages}
                  icon={<Mail size={14} strokeWidth={2} />}
                  compact
                />
              )}

              {user.userId ? (
                <NotificationBell
                  userId={user.userId}
                  initialUnread={user.unreadNotifications}
                  notificationsHref={notificationsHref}
                  compact
                />
              ) : (
                <StaticChip
                  label="Notifications"
                  value={user.unreadNotifications}
                  icon={<span style={{ fontSize: 14 }}>🔔</span>}
                  compact
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={`dashboard-shell-mobile-overlay ${mobileNavOpen ? 'is-open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
        aria-label="Close navigation"
      />

      <aside
        id="dashboard-mobile-navigation"
        aria-hidden={!mobileNavOpen}
        className={`dashboard-shell-mobile-drawer ${mobileNavOpen ? 'is-open' : ''}`}
      >
        <div className="dashboard-shell-mobile-drawer-header">
          <NexternLogo
            markSize={34}
            markRadius={12}
            gap={9}
            textSize={18}
            subtitle={roleLabel}
            subtitleColor="#64748B"
            textColor="#0F172A"
          />
          <button
            type="button"
            className="dashboard-shell-mobile-icon-button dashboard-shell-mobile-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dashboard-shell-mobile-user-card">
          <div className="dashboard-shell-mobile-user-main">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="dashboard-shell-mobile-avatar">{initials}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="dashboard-shell-mobile-user-name">{user.name}</div>
              <div className="dashboard-shell-mobile-user-email">{user.email || roleLabel}</div>
              <div className="dashboard-shell-mobile-user-subtitle">{user.subtitle}</div>
            </div>
          </div>

          <div className="dashboard-shell-mobile-user-badges">
            <span className="dashboard-shell-mobile-badge dashboard-shell-mobile-badge-role">
              {roleLabel}
            </span>
            {premiumActive && (
              <span className="dashboard-shell-mobile-badge dashboard-shell-mobile-badge-premium">
                <Crown size={12} />
                Premium active
              </span>
            )}
          </div>
        </div>

        <div className="dashboard-shell-mobile-shortcuts">
          <Link
            href={messagesHref}
            className="dashboard-shell-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="dashboard-shell-mobile-shortcut-main">
              <Mail size={15} />
              Messages
            </span>
            <span className="dashboard-shell-mobile-shortcut-value">
              {user.unreadMessages > 99 ? '99+' : user.unreadMessages}
            </span>
          </Link>

          <Link
            href={notificationsHref}
            className="dashboard-shell-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="dashboard-shell-mobile-shortcut-main">
              <ShieldCheck size={15} />
              Notifications
            </span>
            <span className="dashboard-shell-mobile-shortcut-value">
              {user.unreadNotifications > 99 ? '99+' : user.unreadNotifications}
            </span>
          </Link>

          <Link
            href={profile.href}
            className="dashboard-shell-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="dashboard-shell-mobile-shortcut-main">
              {profile.icon === 'building' ? <Building2 size={15} /> : <Users size={15} />}
              {profile.label}
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="dashboard-shell-mobile-section">
          <div className="dashboard-shell-mobile-section-title">Navigation</div>
          <nav className="dashboard-shell-mobile-nav-list">
            {resolvedNavItems.map((item) => (
              <div key={`mobile:${item.label}`}>{renderMobilePrimaryLink(item)}</div>
            ))}
          </nav>
        </div>

        {profileMenuItems.length > 1 && (
          <div className="dashboard-shell-mobile-section">
            <div className="dashboard-shell-mobile-section-title">Account</div>
            <div className="dashboard-shell-mobile-nav-list">
              {profileMenuItems.slice(1).map((item) => (
                <Link
                  key={`account:${item.href}`}
                  href={item.href}
                  className="dashboard-shell-mobile-link"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="dashboard-shell-mobile-link-main">
                    <AccountMenuIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        )}

        <button type="button" className="dashboard-shell-mobile-signout" onClick={handleSignOut}>
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <main
        style={{
          flex: hideFooter ? 1 : undefined,
          overflow: hideFooter ? 'hidden' : undefined,
          minWidth: 0,
        }}
      >
        {children}
      </main>

      {!hideFooter && <div style={{ marginTop: 48 }} />}

      <style>{`
        .dashboard-shell-nav::-webkit-scrollbar { display: none; }
        .dashboard-shell-desktop {
          display: block;
        }
        .dashboard-shell-mobile {
          display: none;
        }
        .dashboard-shell-mobile-bar {
          background: #172033;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .dashboard-shell-mobile-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          min-width: 0;
        }
        .dashboard-shell-mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dashboard-shell-mobile-icon-button {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.2);
          background: rgba(255,255,255,0.06);
          color: #E2E8F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .dashboard-shell-mobile-overlay {
          position: fixed;
          inset: 0;
          border: none;
          background: rgba(15,23,42,0.56);
          backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 120;
        }
        .dashboard-shell-mobile-overlay.is-open {
          opacity: 1;
          pointer-events: auto;
        }
        .dashboard-shell-mobile-drawer {
          position: fixed;
          inset: 0 auto 0 0;
          width: min(360px, 92vw);
          background: #F8FAFC;
          box-shadow: 0 24px 60px rgba(15,23,42,0.24);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          transform: translateX(-104%);
          transition: transform 0.28s ease;
          z-index: 130;
        }
        .dashboard-shell-mobile-drawer.is-open {
          transform: translateX(0);
        }
        .dashboard-shell-mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .dashboard-shell-mobile-close {
          background: #0F172A;
          border-color: #0F172A;
          color: #FFFFFF;
        }
        .dashboard-shell-mobile-user-card {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 20px;
          background: #23324A;
          color: #E2E8F0;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 32px rgba(15,23,42,0.16);
        }
        .dashboard-shell-mobile-user-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .dashboard-shell-mobile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .dashboard-shell-mobile-user-name {
          font-size: 15px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dashboard-shell-mobile-user-email,
        .dashboard-shell-mobile-user-subtitle {
          font-size: 12px;
          color: #B8CCE2;
          line-height: 1.45;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dashboard-shell-mobile-user-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dashboard-shell-mobile-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }
        .dashboard-shell-mobile-badge-role {
          background: rgba(34,211,238,0.14);
          color: #CFFAFE;
          border: 1px solid rgba(34,211,238,0.24);
        }
        .dashboard-shell-mobile-badge-premium {
          background: rgba(245,158,11,0.14);
          color: #FDE68A;
          border: 1px solid rgba(245,158,11,0.3);
        }
        .dashboard-shell-mobile-shortcuts,
        .dashboard-shell-mobile-nav-list {
          display: grid;
          gap: 10px;
        }
        .dashboard-shell-mobile-shortcut,
        .dashboard-shell-mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #0F172A;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 6px 20px rgba(148,163,184,0.08);
        }
        .dashboard-shell-mobile-link {
          width: 100%;
          cursor: pointer;
        }
        .dashboard-shell-mobile-link.is-active,
        .dashboard-shell-mobile-child-link.is-active {
          border-color: #BFDBFE;
          background: #EFF6FF;
          color: #1D4ED8;
        }
        .dashboard-shell-mobile-link-main,
        .dashboard-shell-mobile-shortcut-main {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .dashboard-shell-mobile-shortcut-value {
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: #EFF6FF;
          color: #1D4ED8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }
        .dashboard-shell-mobile-section {
          padding: 14px;
          border-radius: 22px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(226,232,240,0.92);
          box-shadow: 0 12px 28px rgba(148,163,184,0.08);
        }
        .dashboard-shell-mobile-section-title {
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748B;
        }
        .dashboard-shell-mobile-group-items {
          display: grid;
          gap: 8px;
          padding: 10px 0 0 12px;
        }
        .dashboard-shell-mobile-child-link {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          text-decoration: none;
          color: #0F172A;
        }
        .dashboard-shell-mobile-child-icon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: #EFF6FF;
          color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dashboard-shell-mobile-child-title {
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 3px;
        }
        .dashboard-shell-mobile-child-description {
          font-size: 12px;
          color: #64748B;
          line-height: 1.55;
        }
        .dashboard-shell-mobile-signout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          border: none;
          border-radius: 16px;
          background: #0F172A;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          margin-top: auto;
        }
        @media (max-width: 960px) {
          .dashboard-shell-desktop {
            display: none;
          }
          .dashboard-shell-mobile {
            display: block;
          }
          .dashboard-hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
