import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroAsideCard,
  HeroCard,
} from '@/components/dashboard/DashboardContent';
import { getBadgeDefinitions, type BadgeCatalogDefinition } from '@/lib/badge-definitions';
import { BadgeAward } from '@/models/BadgeAward';
import { getEventCount } from '@/lib/badge-engine';
import { Trophy } from 'lucide-react';

export default async function StudentBadgesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');

  await connectDB();
  const userId = session.user.id;
  const [unreadNotifications, unreadMessages] = await Promise.all([
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  const definitions = getBadgeDefinitions('student');
  const earnedBadges = await BadgeAward.find({ userId }).select('badgeSlug awardedAt').lean();
  const earnedSlugs = new Set(
    earnedBadges.map((b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug)
  );

  const progressList = await Promise.all(
    definitions.map(async (def: BadgeCatalogDefinition) => {
      const isEarned = earnedSlugs.has(def.badgeSlug);
      let count = 0;

      if (isEarned) {
        count = def.thresholdValue;
      } else {
        try {
          count = await getEventCount(userId, def.triggerEvent, def);
          if (count >= def.thresholdValue) count = def.thresholdValue;
        } catch {}
      }

      return {
        definition: def,
        currentCount: count,
        threshold: def.thresholdValue,
        isEarned,
        progressPercentage: Math.min(100, Math.round((count / def.thresholdValue) * 100)),
      };
    })
  );

  // Badge points — all badge marksRewards sum to 100
  const totalPoints = definitions
    .filter((def) => earnedSlugs.has(def.badgeSlug))
    .reduce((sum: number, def) => sum + (def.marksReward || 0), 0);

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: session.user.name ?? 'Student',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        userId,
        subtitle: session.user.email ?? '',
        unreadNotifications,
        unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Achievements"
          title="Your Badges"
          description={`Unlock badges to earn points and elevate your platform visibility. Every badge proves your commitment to career readiness.`}
          actions={<div />}
          aside={
            <HeroAsideCard
              contentStyle={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 172,
              }}
            >
              <Trophy size={32} color="#FDE047" style={{ marginBottom: 14 }} />
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                {totalPoints} / 100
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.72)',
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                Points Earned
              </div>
            </HeroAsideCard>
          }
        />

        <DashboardSection
          title="Badges & Path"
          description="Complete these milestones to fully enhance your profile."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {progressList.map(
              ({ definition: def, currentCount, threshold, isEarned, progressPercentage }) => {
                const bg = isEarned ? '#EFF6FF' : '#FFFFFF';
                const border = isEarned ? '#60A5FA' : '#E2E8F0';
                const titleColor = isEarned ? '#1E3A8A' : '#1E293B';

                return (
                  <div
                    key={def.badgeSlug}
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: 18,
                      padding: 20,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isEarned && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          padding: '6px 14px',
                          background: '#3B82F6',
                          color: '#FFF',
                          fontSize: 11,
                          fontWeight: 800,
                          borderBottomLeftRadius: 14,
                        }}
                      >
                        EARNED
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16 }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 16,
                          background: isEarned ? '#DBEAFE' : '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                          opacity: isEarned ? 1 : 0.4,
                          flexShrink: 0,
                        }}
                      >
                        {def.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: titleColor }}>
                          {def.name}
                        </div>
                        <div
                          style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}
                        >
                          {def.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: isEarned ? '#DBEAFE' : '#F1F5F9',
                          color: isEarned ? '#1E40AF' : '#64748B',
                        }}
                      >
                        +{def.marksReward || 0} pts
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: isEarned ? '#DCFCE7' : '#F1F5F9',
                          color: isEarned ? '#166534' : '#64748B',
                        }}
                      >
                        Boosts AI Match by {def.aiWeightBoost}x
                      </span>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isEarned ? '#3B82F6' : '#94A3B8',
                        }}
                      >
                        <span>{def.criteria}</span>
                        <span>
                          {Math.min(currentCount, threshold)} / {threshold}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: isEarned ? '#BFDBFE' : '#F1F5F9',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progressPercentage}%`,
                            background: isEarned ? '#2563EB' : '#CBD5E1',
                            borderRadius: 999,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
