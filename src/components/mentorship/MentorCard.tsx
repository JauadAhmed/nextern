'use client';

import Link from 'next/link';
import { Star, Briefcase, Building, CheckCircle2 } from 'lucide-react';

interface Mentor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
    email: string;
  };
  expertise: string[];
  industry: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  averageRating: number;
  totalSessions: number;
  isAvailable: boolean;
  mentorType: 'alumni' | 'professional';
  graduatedFrom?: string;
  badges?: { badgeName: string; badgeIcon: string }[];
}

interface Props {
  mentor: Mentor;
  onRequestSession: (mentorId: string) => void;
}

export default function MentorCard({ mentor, onRequestSession }: Props) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow =
          '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '#93C5FD';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {mentor.userId?.image ? (
          <img
            src={mentor.userId.image}
            alt={mentor.userId.name}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #EFF6FF',
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#2563EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {mentor.userId?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Link
                  href={`/student/mentorship/${mentor._id}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {mentor.userId?.name || 'Unknown'}
                </Link>
                {mentor.mentorType === 'alumni' && (
                  <div title="Verified Alumni">
                    <CheckCircle2 size={16} color="#10B981" />
                  </div>
                )}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                {mentor.currentRole} at{' '}
                <span style={{ color: '#1E293B', fontWeight: 600 }}>{mentor.currentCompany}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            title="Average Rating from Students"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#475569',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            <Star size={14} color="#D97706" fill="#D97706" />
            <span style={{ fontWeight: 800, color: '#92400E' }}>
              {mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}
            </span>
            <span style={{ color: '#B45309' }}>({mentor.totalSessions} sessions)</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#475569',
              background: '#F8FAFC',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            <Briefcase size={14} color="#64748B" />
            {mentor.yearsOfExperience} yrs exp.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#475569',
              background: '#F8FAFC',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            <Building size={14} color="#64748B" />
            {mentor.industry}
          </div>
        </div>

        {/* Badges Display */}
        {mentor.badges && mentor.badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {mentor.badges.map((badge, idx) => {
              const isUploadthingUrl = badge.badgeIcon.startsWith('http');
              return (
                <div
                  key={idx}
                  title={`Achievement: ${badge.badgeName}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    cursor: 'help',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {isUploadthingUrl ? (
                    <img
                      src={badge.badgeIcon}
                      alt={badge.badgeName}
                      style={{ width: 16, height: 16, objectFit: 'contain' }}
                    />
                  ) : (
                    <span>{badge.badgeIcon}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expertise */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {mentor.expertise.slice(0, 4).map((skill, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontWeight: 600,
            }}
          >
            {skill}
          </div>
        ))}
        {mentor.expertise.length > 4 && (
          <div
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: '#F1F5F9',
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            +{mentor.expertise.length - 4} more
          </div>
        )}
      </div>

      {/* Action */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px dashed #E2E8F0',
          display: 'flex',
          gap: 12,
        }}
      >
        <Link
          href={`/student/mentorship/${mentor._id}`}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px 16px',
            borderRadius: 10,
            background: '#F8FAFC',
            color: '#475569',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            border: '1px solid #E2E8F0',
          }}
        >
          View Profile
        </Link>
        <button
          onClick={() => onRequestSession(mentor._id)}
          disabled={!mentor.isAvailable}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            background: mentor.isAvailable ? '#2563EB' : '#E2E8F0',
            color: mentor.isAvailable ? '#FFFFFF' : '#94A3B8',
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: mentor.isAvailable ? 'pointer' : 'not-allowed',
            boxShadow: mentor.isAvailable ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          {mentor.isAvailable ? 'Request Session' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
