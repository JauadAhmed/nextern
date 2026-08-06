'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit,
  FolderKanban,
  Home,
  LogOut,
  Mail,
  Menu,
  UserCircle2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import MessageBell from '@/components/messaging/MessageBell';

interface NavbarProps {
  user: {
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
}

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type FreelanceItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const STUDENT_FREELANCE_ITEMS: FreelanceItem[] = [
  {
    href: '/student/freelance?view=board',
    label: 'Marketplace',
    description: 'Browse the live freelance board',
    icon: <FolderKanban size={15} strokeWidth={2} />,
  },
  {
    href: '/student/freelance?view=services',
    label: 'My Services',
    description: 'Manage your service listings',
    icon: <BriefcaseBusiness size={15} strokeWidth={2} />,
  },
  {
    href: '/student/freelance?view=freelancerOrders',
    label: 'Freelancer Orders',
    description: 'Track work you are delivering',
    icon: <ClipboardList size={15} strokeWidth={2} />,
  },
  {
    href: '/student/freelance?view=finance',
    label: 'Earnings & Invoices',
    description: 'View balance, invoices, and withdrawals',
    icon: <Wallet size={15} strokeWidth={2} />,
  },
];

export default function StudentNavbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [freelanceMenuOpen, setFreelanceMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileFreelanceOpen, setMobileFreelanceOpen] = useState(
    () => pathname?.startsWith('/student/freelance') ?? false
  );
  const isMentorMode = user.role === 'alumni';

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const primaryLinks = useMemo<NavLinkItem[]>(
    () =>
      isMentorMode
        ? [
            {
              href: '/student/mentorship/dashboard',
              label: 'Sessions',
              icon: <CalendarDays size={15} strokeWidth={2} />,
            },
            {
              href: '/student/mentorship/dashboard?tab=achievements',
              label: 'Achievements',
              icon: <Award size={15} strokeWidth={2} />,
            },
            {
              href: '/student/mentorship/dashboard?tab=profile',
              label: 'Edit Profile',
              icon: <Edit size={15} strokeWidth={2} />,
            },
          ]
        : [
            {
              href: '/student/dashboard',
              label: 'Overview',
              icon: <Home size={15} strokeWidth={2} />,
            },
            {
              href: '/student/jobs',
              label: 'Jobs',
              icon: <BriefcaseBusiness size={15} strokeWidth={2} />,
            },
            {
              href: '/student/applications',
              label: 'Applications',
              icon: <ClipboardList size={15} strokeWidth={2} />,
            },
            {
              href: '/student/mentorship',
              label: 'Mentors',
              icon: <Users size={15} strokeWidth={2} />,
            },
          ],
    [isMentorMode]
  );

  const accountLinks = useMemo(
    () =>
      isMentorMode
        ? [
            {
              href: '/student/mentorship/sessions',
              label: 'My Sessions',
              description: 'View scheduled sessions',
              icon: <CalendarDays size={15} strokeWidth={2} />,
            },
            {
              href: '/student/mentorship/dashboard',
              label: 'Mentor Dashboard',
              description: 'Go to your mentor overview',
              icon: <Users size={15} strokeWidth={2} />,
            },
          ]
        : [
            {
              href: '/student/jobs',
              label: 'Browse Jobs',
              description: 'Find internships and roles',
              icon: <BriefcaseBusiness size={15} strokeWidth={2} />,
            },
            {
              href: '/student/applications',
              label: 'My Applications',
              description: 'Track your pipeline',
              icon: <ClipboardList size={15} strokeWidth={2} />,
            },
            {
              href: '/student/freelance?view=board',
              label: 'Freelance Board',
              description: 'Offer services and manage gigs',
              icon: <FolderKanban size={15} strokeWidth={2} />,
            },
            {
              href: '/student/mentorship',
              label: 'Mentorship Hub',
              description: 'Manage sessions and mentors',
              icon: <Users size={15} strokeWidth={2} />,
            },
          ],
    [isMentorMode]
  );

  const isActiveHref = useMemo(
    () => (href: string) => {
      const normalized = href.split('#')[0].split('?')[0];
      return pathname === normalized;
    },
    [pathname]
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setFreelanceMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  return (
    <div ref={shellRef}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#1E293B',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 18px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div className="student-navbar-desktop">
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/student/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: '#FFFFFF',
                textDecoration: 'none',
              }}
            >
              <NexternLogo
                markSize={38}
                markRadius={12}
                textSize={18}
                textColor="#FFFFFF"
                subtitle={isMentorMode ? 'Mentor dashboard' : 'Student dashboard'}
                subtitleColor="#94A3B8"
              />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {primaryLinks.map((item) => {
                const active = isActiveHref(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: active ? '#FFFFFF' : '#CBD5E1',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '8px 10px',
                      borderRadius: 999,
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}

              {!isMentorMode && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setFreelanceMenuOpen((value) => !value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      background: freelanceMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: freelanceMenuOpen ? '#FFFFFF' : '#CBD5E1',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: 999,
                    }}
                  >
                    <FolderKanban size={15} strokeWidth={2} />
                    Freelance
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      style={{
                        transform: freelanceMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {freelanceMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        zIndex: 90,
                        width: 'min(280px, calc(100vw - 24px))',
                        background: '#FFFFFF',
                        borderRadius: 18,
                        border: '1px solid #D9E2EC',
                        boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
                        padding: 10,
                      }}
                    >
                      {STUDENT_FREELANCE_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setFreelanceMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '11px 12px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: '#1E293B',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            marginBottom: 6,
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
                            {item.icon}
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
                    </div>
                  )}
                </div>
              )}

              {user.userId ? (
                <MessageBell
                  userId={user.userId}
                  initialUnread={user.unreadMessages}
                  href="/student/messages"
                />
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#D8E3F1',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'inline-flex', color: '#22D3EE' }}>
                    <Mail size={14} strokeWidth={2} />
                  </span>
                  <span>Messages</span>
                  <span style={{ color: '#FFFFFF' }}>{user.unreadMessages}</span>
                </div>
              )}

              {user.userId ? (
                <NotificationBell
                  userId={user.userId}
                  initialUnread={user.unreadNotifications}
                  notificationsHref="/student/notifications"
                />
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#D8E3F1',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'inline-flex', color: '#22D3EE' }}>🔔</span>
                  <span>Alerts</span>
                  <span style={{ color: '#FFFFFF' }}>{user.unreadNotifications}</span>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen((value) => !value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: menuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF',
                    borderRadius: 999,
                    padding: '6px 10px 6px 6px',
                    cursor: 'pointer',
                  }}
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {isMentorMode ? 'Mentor' : `${user.opportunityScore} score`}
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    strokeWidth={2}
                    style={{
                      transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 'min(240px, calc(100vw - 24px))',
                      background: '#FFFFFF',
                      borderRadius: 18,
                      border: '1px solid #D9E2EC',
                      boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
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
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>
                        {user.name}
                      </div>
                      <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>
                        {user.email}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: isMentorMode ? '#7C3AED' : '#2563EB',
                          fontWeight: 700,
                        }}
                      >
                        <UserCircle2 size={13} />
                        {isMentorMode
                          ? 'Alumni Mentor'
                          : `${user.profileCompleteness}% profile complete`}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <Link
                        href="/student/profile"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '11px 12px',
                          borderRadius: 12,
                          textDecoration: 'none',
                          color: '#1E293B',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
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
                          <UserCircle2 size={15} strokeWidth={2} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                            My Profile
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            View and edit your profile
                          </div>
                        </div>
                      </Link>

                      {accountLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '11px 12px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: '#1E293B',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
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
                            {item.icon}
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          border: 'none',
                          borderRadius: 12,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          padding: '12px',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} strokeWidth={2} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="student-navbar-mobile">
          <div className="student-navbar-mobile-bar">
            <button
              type="button"
              className="student-navbar-mobile-icon-button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              aria-controls="student-mobile-navigation"
            >
              <Menu size={18} />
            </button>

            <Link href="/student/dashboard" className="student-navbar-mobile-brand">
              <NexternLogo
                markSize={32}
                markRadius={12}
                gap={8}
                textSize={18}
                textColor="#FFFFFF"
                subtitle={undefined}
              />
            </Link>

            <div className="student-navbar-mobile-actions">
              {user.userId ? (
                <MessageBell
                  userId={user.userId}
                  initialUnread={user.unreadMessages}
                  href="/student/messages"
                  compact
                />
              ) : (
                <div
                  style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#D8E3F1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={14} strokeWidth={2} color="#22D3EE" />
                </div>
              )}

              {user.userId ? (
                <NotificationBell
                  userId={user.userId}
                  initialUnread={user.unreadNotifications}
                  notificationsHref="/student/notifications"
                  compact
                />
              ) : (
                <div
                  style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#D8E3F1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 14 }}>🔔</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <button
        type="button"
        className={`student-navbar-mobile-overlay ${mobileNavOpen ? 'is-open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
        aria-label="Close navigation"
      />

      <aside
        id="student-mobile-navigation"
        aria-hidden={!mobileNavOpen}
        className={`student-navbar-mobile-drawer ${mobileNavOpen ? 'is-open' : ''}`}
      >
        <div className="student-navbar-mobile-drawer-header">
          <NexternLogo
            markSize={34}
            markRadius={12}
            gap={9}
            textSize={18}
            subtitle={isMentorMode ? 'Mentor dashboard' : 'Student dashboard'}
            subtitleColor="#64748B"
            textColor="#0F172A"
          />
          <button
            type="button"
            className="student-navbar-mobile-icon-button student-navbar-mobile-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="student-navbar-mobile-user-card">
          <div className="student-navbar-mobile-user-main">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="student-navbar-mobile-avatar">{initials}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="student-navbar-mobile-user-name">{user.name}</div>
              <div className="student-navbar-mobile-user-email">{user.email}</div>
              <div className="student-navbar-mobile-user-subtitle">
                {isMentorMode
                  ? 'Alumni mentor workspace'
                  : `${user.opportunityScore} score · ${user.profileCompleteness}% profile complete`}
              </div>
            </div>
          </div>
          <div className="student-navbar-mobile-badges">
            <span className="student-navbar-mobile-badge student-navbar-mobile-badge-role">
              {isMentorMode ? 'Mentor' : 'Student'}
            </span>
            {!isMentorMode && (
              <span className="student-navbar-mobile-badge student-navbar-mobile-badge-progress">
                {user.profileCompleteness}% complete
              </span>
            )}
          </div>
        </div>

        <div className="student-navbar-mobile-shortcuts">
          <Link
            href="/student/messages"
            className="student-navbar-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="student-navbar-mobile-shortcut-main">
              <Mail size={15} />
              Messages
            </span>
            <span className="student-navbar-mobile-shortcut-value">
              {user.unreadMessages > 99 ? '99+' : user.unreadMessages}
            </span>
          </Link>

          <Link
            href="/student/notifications"
            className="student-navbar-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="student-navbar-mobile-shortcut-main">
              <span style={{ fontSize: 15 }}>🔔</span>
              Notifications
            </span>
            <span className="student-navbar-mobile-shortcut-value">
              {user.unreadNotifications > 99 ? '99+' : user.unreadNotifications}
            </span>
          </Link>

          <Link
            href="/student/profile"
            className="student-navbar-mobile-shortcut"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="student-navbar-mobile-shortcut-main">
              <UserCircle2 size={15} />
              My Profile
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="student-navbar-mobile-section">
          <div className="student-navbar-mobile-section-title">Navigation</div>
          <div className="student-navbar-mobile-nav-list">
            {primaryLinks.map((item) => (
              <Link
                key={`mobile:${item.href}`}
                href={item.href}
                className={`student-navbar-mobile-link ${isActiveHref(item.href) ? 'is-active' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="student-navbar-mobile-link-main">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}

            {!isMentorMode && (
              <div
                className={`student-navbar-mobile-group ${mobileFreelanceOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className={`student-navbar-mobile-link ${pathname.startsWith('/student/freelance') ? 'is-active' : ''}`}
                  onClick={() => setMobileFreelanceOpen((value) => !value)}
                  aria-expanded={mobileFreelanceOpen}
                >
                  <span className="student-navbar-mobile-link-main">
                    <FolderKanban size={15} strokeWidth={2} />
                    <span>Freelance</span>
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: mobileFreelanceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {mobileFreelanceOpen && (
                  <div className="student-navbar-mobile-group-items">
                    {STUDENT_FREELANCE_ITEMS.map((item) => (
                      <Link
                        key={`freelance:${item.href}`}
                        href={item.href}
                        className={`student-navbar-mobile-child-link ${isActiveHref(item.href) ? 'is-active' : ''}`}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <div className="student-navbar-mobile-child-icon">{item.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="student-navbar-mobile-child-title">{item.label}</div>
                          <div className="student-navbar-mobile-child-description">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button type="button" className="student-navbar-mobile-signout" onClick={handleSignOut}>
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <style>{`
        .student-navbar-desktop {
          display: block;
        }
        .student-navbar-mobile {
          display: none;
        }
        .student-navbar-mobile-bar {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .student-navbar-mobile-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          min-width: 0;
        }
        .student-navbar-mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .student-navbar-mobile-icon-button {
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
        .student-navbar-mobile-overlay {
          position: fixed;
          inset: 0;
          border: none;
          background: rgba(15,23,42,0.56);
          backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 55;
        }
        .student-navbar-mobile-overlay.is-open {
          opacity: 1;
          pointer-events: auto;
        }
        .student-navbar-mobile-drawer {
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
          z-index: 56;
        }
        .student-navbar-mobile-drawer.is-open {
          transform: translateX(0);
        }
        .student-navbar-mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .student-navbar-mobile-close {
          background: #0F172A;
          border-color: #0F172A;
          color: #FFFFFF;
        }
        .student-navbar-mobile-user-card {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 24px;
          background: #23324A;
          color: #E2E8F0;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 32px rgba(15,23,42,0.16);
        }
        .student-navbar-mobile-user-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .student-navbar-mobile-avatar {
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
        .student-navbar-mobile-user-name {
          font-size: 15px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .student-navbar-mobile-user-email,
        .student-navbar-mobile-user-subtitle {
          font-size: 12px;
          color: #B8CCE2;
          line-height: 1.45;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .student-navbar-mobile-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .student-navbar-mobile-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }
        .student-navbar-mobile-badge-role {
          background: rgba(34,211,238,0.14);
          color: #CFFAFE;
          border: 1px solid rgba(34,211,238,0.24);
        }
        .student-navbar-mobile-badge-progress {
          background: rgba(255,255,255,0.12);
          color: #FFFFFF;
          border: 1px solid rgba(255,255,255,0.16);
        }
        .student-navbar-mobile-shortcuts,
        .student-navbar-mobile-nav-list {
          display: grid;
          gap: 10px;
        }
        .student-navbar-mobile-shortcut,
        .student-navbar-mobile-link {
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
        .student-navbar-mobile-link {
          width: 100%;
          cursor: pointer;
        }
        .student-navbar-mobile-link.is-active,
        .student-navbar-mobile-child-link.is-active {
          border-color: #BFDBFE;
          background: #EFF6FF;
          color: #1D4ED8;
        }
        .student-navbar-mobile-link-main,
        .student-navbar-mobile-shortcut-main {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .student-navbar-mobile-shortcut-value {
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
        .student-navbar-mobile-section {
          padding: 14px;
          border-radius: 22px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(226,232,240,0.92);
          box-shadow: 0 12px 28px rgba(148,163,184,0.08);
        }
        .student-navbar-mobile-section-title {
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748B;
        }
        .student-navbar-mobile-group-items {
          display: grid;
          gap: 8px;
          padding: 10px 0 0 12px;
        }
        .student-navbar-mobile-child-link {
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
        .student-navbar-mobile-child-icon {
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
        .student-navbar-mobile-child-title {
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 3px;
        }
        .student-navbar-mobile-child-description {
          font-size: 12px;
          color: #64748B;
          line-height: 1.55;
        }
        .student-navbar-mobile-signout {
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
          .student-navbar-desktop {
            display: none;
          }
          .student-navbar-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
