import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
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
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
import { Trophy } from 'lucide-react';

export default async function DeptBadgesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'dept_head') redirect('/login');

  await connectDB();
  const userId = session.user.id;

  const definitions = getBadgeDefinitions('dept_head');
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
        awardedAt: earnedBadges.find(
          (b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug === def.badgeSlug
        )?.awardedAt,
      };
    })
  );

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{
        name: session.user.name ?? 'Department Head',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
        userId: session.user.id,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Achievements"
          title="Department Head Badges"
          description="Earn recognition for driving department-wide excellence. These badges reflect your strategic leadership in student career readiness."
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
              <Trophy size={32} color="#A78BFA" style={{ marginBottom: 14 }} />
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                {earnedSlugs.size}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.72)',
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                Badges Unlocked
              </div>
            </HeroAsideCard>
          }
        />

        <DashboardSection
          title="Leadership Milestones"
          description="Drive department performance and student engagement to unlock these strategic achievements."
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
                const bg = isEarned ? '#F5F3FF' : '#FFFFFF';
                const border = isEarned ? '#A78BFA' : '#E2E8F0';
                const titleColor = isEarned ? '#4C1D95' : '#1E293B';

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
                          background: '#7C3AED',
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
                          background: isEarned ? '#EDE9FE' : '#F1F5F9',
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
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: titleColor,
                          }}
                        >
                          {def.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#64748B',
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {def.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isEarned ? '#7C3AED' : '#94A3B8',
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
                          background: isEarned ? '#DDD6FE' : '#F1F5F9',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progressPercentage}%`,
                            background: isEarned ? '#7C3AED' : '#CBD5E1',
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
