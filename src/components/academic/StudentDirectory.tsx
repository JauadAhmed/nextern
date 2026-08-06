import Link from 'next/link';
import PaginatedCollection from '@/components/ui/PaginatedCollection';

type StudentDirectoryStudent = {
  id: string;
  name: string;
  email: string;
  university?: string;
  department?: string;
  studentId?: string;
  currentSemester?: string;
  yearOfStudy?: number;
  opportunityScore: number;
  profileCompleteness: number;
  cgpa?: number;
};

export default function StudentDirectory({
  actionPath,
  title,
  description,
  scopeLabel,
  students,
  departments,
  semesters,
  filters,
  emptyDescription,
}: {
  actionPath: string;
  title: string;
  description: string;
  scopeLabel: string;
  students: StudentDirectoryStudent[];
  departments: string[];
  semesters: string[];
  filters: {
    q: string;
    studentId: string;
    semester: string;
    department: string;
    sort: string;
  };
  emptyDescription: string;
}) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #D9E2EC',
          boxShadow: '0 16px 36px rgba(15,23,42,0.05)',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Filter students
            </div>
            <h2
              style={{
                margin: '8px 0 0',
                fontSize: 24,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
              }}
            >
              {title}
            </h2>
            <p style={{ margin: '10px 0 0', color: '#64748B', fontSize: 14, lineHeight: 1.7 }}>
              {description}
            </p>
          </div>
          <div
            style={{
              padding: '7px 13px',
              borderRadius: 999,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1D4ED8',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {scopeLabel}
          </div>
        </div>

        <form
          className="academic-student-filters"
          method="get"
          action={actionPath}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1.2fr) minmax(0, 0.9fr) repeat(3, minmax(0, 0.8fr)) auto auto',
            gap: 12,
          }}
        >
          <Field label="Search">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Name, email, or department"
              style={inputStyle()}
            />
          </Field>
          <Field label="Student ID">
            <input
              name="studentId"
              defaultValue={filters.studentId}
              placeholder="22301206"
              style={inputStyle()}
            />
          </Field>
          <Field label="Semester">
            <select name="semester" defaultValue={filters.semester} style={inputStyle()}>
              <option value="">All semesters</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <select name="department" defaultValue={filters.department} style={inputStyle()}>
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort by">
            <select name="sort" defaultValue={filters.sort} style={inputStyle()}>
              <option value="score_desc">Opportunity score</option>
              <option value="profile_desc">Profile completeness</option>
              <option value="cgpa_desc">CGPA</option>
              <option value="name_asc">Name</option>
              <option value="semester_asc">Semester</option>
            </select>
          </Field>
          <button type="submit" style={submitStyle()}>
            Apply filters
          </button>
          <Link href={actionPath} style={resetStyle()}>
            Reset
          </Link>
        </form>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #D9E2EC',
          boxShadow: '0 16px 36px rgba(15,23,42,0.05)',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Results
            </div>
            <h2
              style={{
                margin: '8px 0 0',
                fontSize: 24,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
              }}
            >
              {students.length} student{students.length === 1 ? '' : 's'}
            </h2>
          </div>
        </div>

        {students.length === 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: '1px dashed #CBD5E1',
              background: '#F8FAFC',
              padding: '24px 20px',
              color: '#64748B',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {emptyDescription}
          </div>
        ) : (
          <PaginatedCollection
            itemLabel="students"
            resetKey={`${filters.q}|${filters.studentId}|${filters.semester}|${filters.department}|${filters.sort}`}
            style={{ display: 'grid', gap: 14 }}
          >
            {students.map((student) => (
              <div
                key={student.id}
                style={{
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '18px 18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {student.name}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                      {student.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <MetricBadge
                      label="Opportunity"
                      value={`${student.opportunityScore}%`}
                      tone={
                        student.opportunityScore >= 70
                          ? 'green'
                          : student.opportunityScore >= 40
                            ? 'amber'
                            : 'red'
                      }
                    />
                    <MetricBadge
                      label="Profile"
                      value={`${student.profileCompleteness}%`}
                      tone="blue"
                    />
                    <MetricBadge
                      label="CGPA"
                      value={typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : '—'}
                      tone="slate"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {student.studentId ? (
                    <Chip label={`ID: ${student.studentId}`} tone="slate" />
                  ) : null}
                  {student.department ? <Chip label={student.department} tone="blue" /> : null}
                  {student.currentSemester ? (
                    <Chip label={student.currentSemester} tone="green" />
                  ) : null}
                  {student.yearOfStudy ? (
                    <Chip label={`Year ${student.yearOfStudy}`} tone="amber" />
                  ) : null}
                  {student.university ? <Chip label={student.university} tone="slate" /> : null}
                </div>
              </div>
            ))}
          </PaginatedCollection>
        )}
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .academic-student-filters {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 720px) {
          .academic-student-filters {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({ label, tone }: { label: string; tone: 'blue' | 'slate' | 'green' | 'amber' }) {
  const palette = {
    blue: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    slate: { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' },
    green: { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 11px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function MetricBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'amber' | 'red' | 'blue' | 'slate';
}) {
  const palette = {
    green: { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
    red: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' },
    blue: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    slate: { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' },
  }[tone];

  return (
    <div
      style={{
        borderRadius: 14,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        padding: '9px 12px',
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, color: palette.color, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 14,
    border: '1px solid #CBD5E1',
    padding: '12px 14px',
    fontSize: 14,
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
  };
}

function submitStyle(): React.CSSProperties {
  return {
    alignSelf: 'end',
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
  };
}

function resetStyle(): React.CSSProperties {
  return {
    alignSelf: 'end',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    padding: '12px 16px',
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#334155',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
  };
}
