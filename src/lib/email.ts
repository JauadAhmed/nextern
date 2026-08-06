// src/lib/email.ts
// Uses Gmail SMTP via nodemailer.

import nodemailer from 'nodemailer';
import { getLoginUrl } from '@/lib/app-url';
import { formatDhakaDateTime } from '@/lib/datetime';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

type ApplicationStatusEmailStatus =
  | 'under_review'
  | 'shortlisted'
  | 'assessment_sent'
  | 'interview_scheduled'
  | 'hired'
  | 'rejected';

function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function createGmailTransport() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  if (!gmailUser) throw new Error('GMAIL_USER is not set in environment variables');
  const transporter = createGmailTransport();
  await transporter.sendMail({
    from: `Nextern <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

// ── Shared wrapper ─────────────────────────────────────────────────────────
function emailWrapper(bodyContent: string, accentTop = '#22D3EE'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Nextern</title>
</head>
<body style="margin:0;padding:0;background:#EDF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDF2F7;padding:44px 0 52px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#FFFFFF;border-radius:20px;overflow:hidden;
                 border:1px solid #CBD5E0;
                 box-shadow:0 8px 36px rgba(15,23,42,0.09);">

          <!-- Header -->
          <tr>
            <td style="background:#0F172A;padding:0;">
              <!-- Accent bar -->
              <div style="height:4px;background:${accentTop};"></div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 22px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="font-size:22px;font-weight:800;color:#F8FAFC;
                                       letter-spacing:-0.3px;">
                            nextern<span style="color:${accentTop};">.</span>
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size:10px;font-weight:600;
                                       letter-spacing:1.6px;text-transform:uppercase;
                                       color:#64748B;">
                            Official Communication
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${bodyContent}

          <!-- Footer -->
          <tr>
            <td style="background:#F7FAFC;border-top:1px solid #E2E8F0;
                       padding:22px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94A3B8;font-size:11px;line-height:1.75;">
                    This is an automated message sent by the Nextern platform. Please do not reply to this email.
                    <br/>If you believe you received this in error, you may disregard it or contact support through your account.
                  </td>
                  <td align="right" style="padding-left:20px;white-space:nowrap;vertical-align:top;">
                    <span style="color:#CBD5E1;font-size:11px;">&copy; 2026 Nextern</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Info table helper ──────────────────────────────────────────────────────
function infoTable(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (r, i) => `
    <tr>
      <td style="padding:13px 20px;${i < rows.length - 1 ? 'border-bottom:1px solid #EDF2F7;' : ''}">
        <span style="display:block;font-size:10px;font-weight:700;
                     letter-spacing:1.3px;text-transform:uppercase;
                     color:#94A3B8;margin-bottom:4px;">${r.label}</span>
        <span style="font-size:14px;font-weight:600;color:#1A202C;">${r.value}</span>
      </td>
    </tr>`
    )
    .join('');

  return `
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:#F7FAFC;border:1px solid #E2E8F0;
           border-radius:12px;overflow:hidden;margin-bottom:24px;">
    ${rowsHtml}
  </table>`;
}

// ── Highlighted callout box ────────────────────────────────────────────────
function calloutBox(text: string, bg: string, borderColor: string, textColor: string): string {
  return `
  <div style="background:${bg};border-left:4px solid ${borderColor};
              padding:14px 18px;border-radius:0 10px 10px 0;margin-bottom:20px;">
    <p style="margin:0;color:${textColor};font-size:13px;
              font-weight:600;line-height:1.75;">${text}</p>
  </div>`;
}

// ── CTA button ─────────────────────────────────────────────────────────────
function ctaButton(label: string, href: string, bg: string): string {
  return `
  <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
    <tr>
      <td style="border-radius:10px;background:${bg};">
        <a href="${href}"
           style="display:inline-block;padding:13px 30px;
                  color:#FFFFFF;text-decoration:none;
                  font-size:14px;font-weight:700;
                  letter-spacing:0.2px;border-radius:10px;">
          ${label} &rarr;
        </a>
      </td>
    </tr>
  </table>`;
}

// ── Application status email ───────────────────────────────────────────────
export function applicationStatusEmailTemplate(params: {
  studentName: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatusEmailStatus;
}): { subject: string; html: string } {
  const { studentName, jobTitle, companyName, status } = params;
  const dashboardUrl = `${getAppUrl()}/student/applications`;

  type Cfg = {
    subject: string;
    accentColor: string;
    badgeLabel: string;
    badgeBg: string;
    badgeText: string;
    headline: string;
    lead: string;
    body: string;
    callout?: { text: string; bg: string; border: string; textColor: string };
    closing: string;
    ctaLabel: string;
    ctaBg: string;
  };

  const CONFIG: Record<ApplicationStatusEmailStatus, Cfg> = {
    // ── Under Review ────────────────────────────────────────────────────
    under_review: {
      subject: `Nextern Application Update — Under review for ${jobTitle} at ${companyName}`,
      accentColor: '#F59E0B',
      badgeLabel: 'Under Review',
      badgeBg: '#FFFBEB',
      badgeText: '#B45309',
      headline: 'Your application is under active review',
      lead: `Thank you for applying to <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`,
      body: `
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          We are pleased to inform you that your application has successfully advanced to the review stage.
          The hiring team at ${companyName} is currently conducting a detailed evaluation of your profile,
          qualifications, and submitted materials.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Reviews of this nature are conducted with care and may take several business days to complete.
          You will be notified promptly as soon as a decision or update is available.
          We encourage you to keep your Nextern profile current and continue exploring other relevant opportunities in the meantime.
        </p>`,
      callout: {
        text: 'No action is required from you at this stage. Simply await further communication from our team.',
        bg: '#FFFBEB',
        border: '#F59E0B',
        textColor: '#92400E',
      },
      closing:
        'You may monitor your application status in real time through your Nextern dashboard.',
      ctaLabel: 'Track My Application',
      ctaBg: '#D97706',
    },

    // ── Shortlisted ────────────────────────────────────────────────────
    shortlisted: {
      subject: `Nextern Application update — Shortlisted for ${jobTitle} at ${companyName}`,
      accentColor: '#10B981',
      badgeLabel: 'Shortlisted',
      badgeBg: '#ECFDF5',
      badgeText: '#065F46',
      headline: 'You have been shortlisted',
      lead: `We are delighted to share a significant update regarding your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`,
      body: `
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          Following a rigorous review of all candidate submissions, the hiring team at ${companyName} has
          selected you as one of a distinguished group of shortlisted candidates for this role.
          This is a strong indicator that your academic background, technical competencies, and professional
          profile have made a compelling impression on the selection committee.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          The subsequent stage of the process may involve a formal assessment, a structured interview, or both.
          We strongly encourage you to review the role requirements thoroughly and prepare accordingly.
          Further instructions will be communicated to you in due course.
        </p>`,
      callout: {
        text: 'Ensure your Nextern profile, resume, and contact details are fully up to date. Timely responses to any follow-up communications are essential.',
        bg: '#ECFDF5',
        border: '#10B981',
        textColor: '#065F46',
      },
      closing:
        'View your application status and any accompanying instructions directly from your Nextern dashboard.',
      ctaLabel: 'View Application',
      ctaBg: '#059669',
    },

    // ── Assessment Sent ────────────────────────────────────────────────
    assessment_sent: {
      subject: `Assessment assigned — ${jobTitle} at ${companyName}`,
      accentColor: '#3B82F6',
      badgeLabel: 'Assessment Assigned',
      badgeBg: '#EFF6FF',
      badgeText: '#1D4ED8',
      headline: 'An assessment has been assigned to you',
      lead: `As part of the structured selection process for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>, a formal assessment has been issued to you.`,
      body: `
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          This assessment is a critical component of the evaluation framework and will be reviewed directly
          by the ${companyName} hiring team. It is designed to evaluate your aptitude, knowledge,
          and problem-solving capacity as they relate to the requirements of this role.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Please read all instructions with care before you begin. Incomplete or late submissions may not
          be considered in the evaluation. We recommend setting aside adequate, uninterrupted time to
          complete the assessment to the best of your ability.
        </p>`,
      callout: {
        text: 'Action required: Please log in to your Nextern account at your earliest convenience to access and complete your assigned assessment before the stated deadline.',
        bg: '#EFF6FF',
        border: '#3B82F6',
        textColor: '#1E3A8A',
      },
      closing:
        'Access your assessment and track your submission status directly from your Nextern applications dashboard.',
      ctaLabel: 'Access My Assessment',
      ctaBg: '#2563EB',
    },

    // ── Interview Scheduled ────────────────────────────────────────────
    interview_scheduled: {
      subject: `Interview scheduled — ${jobTitle} at ${companyName}`,
      accentColor: '#8B5CF6',
      badgeLabel: 'Interview Scheduled',
      badgeBg: '#F5F3FF',
      badgeText: '#5B21B6',
      headline: 'Your interview has been confirmed',
      lead: `We are pleased to inform you that <strong>${companyName}</strong> has scheduled a formal interview for your application to <strong>${jobTitle}</strong>.`,
      body: `
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          Further details regarding your interview, including the date, time, and format — will be shared with you soon.
        </p>
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          To present yourself in the best possible light, we recommend the following:
        </p>
        <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:14px;line-height:2.0;">
          <li>Review the full job description and align your responses to the stated requirements</li>
          <li>Research ${companyName}'s mission, recent work, and industry positioning</li>
          <li>Confirm your attendance promptly if a response is required by the employer</li>
        </ul>`,
      callout: {
        text: 'Punctuality, preparedness, and professionalism are the three most important qualities to demonstrate on the day of your interview.',
        bg: '#F5F3FF',
        border: '#8B5CF6',
        textColor: '#4C1D95',
      },
      closing:
        'Review your complete interview schedule and employer notes from your Nextern dashboard.',
      ctaLabel: 'View Interview Details',
      ctaBg: '#7C3AED',
    },

    // ── Hired ──────────────────────────────────────────────────────────
    hired: {
      subject: `Nextern Application update — Selection for ${jobTitle} at ${companyName}`,
      accentColor: '#10B981',
      badgeLabel: 'Selected',
      badgeBg: '#ECFDF5',
      badgeText: '#065F46',
      headline: 'Congratulations on your selection',
      lead: `On behalf of the entire Nextern team, we are honoured to inform you that <strong>${companyName}</strong> has officially selected you for the position of <strong>${jobTitle}</strong>.`,
      body: `
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:14px;
                    padding:22px;text-align:center;margin-bottom:22px;">
          <p style="margin:0 0 6px;font-size:30px;line-height:1;">&#127881;</p>
          <p style="margin:0;font-size:18px;font-weight:800;color:#065F46;letter-spacing:-0.2px;">
            Welcome to your next chapter, ${studentName.split(' ')[0]}.
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#059669;line-height:1.6;">
            This is the result of your preparation, persistence, and professionalism.
          </p>
        </div>
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          This outcome reflects the strength of your candidacy across every stage of the selection process.
          The hiring team at ${companyName} evaluated a competitive pool of applicants and determined that
          your qualifications, demonstrated skills, and overall fit were the strongest match for this role.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          You can expect ${companyName} to follow up with formal onboarding documentation and next steps.
          Please monitor your registered email address and your Nextern inbox closely in the coming days,
          and ensure that your contact information remains accurate and accessible.
        </p>`,
      callout: {
        text: 'Respond promptly to any onboarding communications from the employer. Timely follow-through at this stage is essential to formally securing your position.',
        bg: '#F0FDF4',
        border: '#10B981',
        textColor: '#065F46',
      },
      closing:
        'Your updated application status is reflected on your Nextern dashboard. We wish you every success in this new role.',
      ctaLabel: 'View on Nextern',
      ctaBg: '#059669',
    },

    // ── Rejected ───────────────────────────────────────────────────────
    rejected: {
      subject: `Nextern Application update — ${jobTitle} at ${companyName}`,
      accentColor: '#64748B',
      badgeLabel: 'Not Selected',
      badgeBg: '#F8FAFC',
      badgeText: '#475569',
      headline: 'An update on your application',
      lead: `Thank you for the time and effort you invested in your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`,
      body: `
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          After a thorough and careful review of all candidate submissions, ${companyName} has concluded
          that they will not be moving forward with your application for this particular position at this time.
          We recognise that this is not the outcome you were hoping for, and we appreciate the commitment
          you demonstrated throughout the process.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Please know that this decision is not a definitive reflection of your potential or professional
          capability. Competitive hiring processes involve many subjective factors, and outcomes do not
          always align with a candidate's true merit. We strongly encourage you to continue developing
          your profile and applying to opportunities that align with your goals and expertise.
        </p>`,
      callout: {
        text: 'Use the AI Skill Gap Analysis tool on Nextern to identify targeted areas for development, and explore new opportunities that match your evolving profile.',
        bg: '#F8FAFC',
        border: '#94A3B8',
        textColor: '#374151',
      },
      closing:
        'Your application history and profile remain available on Nextern. We look forward to supporting your continued journey.',
      ctaLabel: 'Explore Opportunities',
      ctaBg: '#475569',
    },
  };

  const cfg = CONFIG[status];

  const html = emailWrapper(
    `
    <!-- Status badge + greeting -->
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;
                     background:${cfg.badgeBg};
                     color:${cfg.badgeText};
                     font-size:10px;font-weight:700;
                     letter-spacing:1.4px;text-transform:uppercase;
                     padding:5px 13px;border-radius:6px;
                     border:1px solid ${cfg.badgeText}30;">
          ${cfg.badgeLabel}
        </span>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;font-weight:500;">
          Dear ${studentName},
        </p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;
                   letter-spacing:-0.4px;line-height:1.25;">
          ${cfg.headline}
        </h1>
      </td>
    </tr>

    <!-- Lead sentence -->
    <tr>
      <td style="padding:12px 40px 0;">
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          ${cfg.lead}
        </p>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>

    <!-- Info table -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Position', value: jobTitle },
          { label: 'Organisation', value: companyName },
          { label: 'Application Status', value: cfg.badgeLabel },
        ])}
      </td>
    </tr>

    <!-- Body copy -->
    <tr>
      <td style="padding:0 40px 0;">
        ${cfg.body}
      </td>
    </tr>

    <!-- Callout -->
    ${
      cfg.callout
        ? `
    <tr>
      <td style="padding:0 40px 0;">
        ${calloutBox(cfg.callout.text, cfg.callout.bg, cfg.callout.border, cfg.callout.textColor)}
      </td>
    </tr>`
        : ''
    }

    <!-- Closing line -->
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0;color:#64748B;font-size:13px;line-height:1.8;">
          ${cfg.closing}
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton(cfg.ctaLabel, dashboardUrl, cfg.ctaBg)}
      </td>
    </tr>
  `,
    cfg.accentColor
  );

  return { subject: cfg.subject, html };
}

export function assessmentAssignedEmailTemplate(params: {
  studentName: string;
  jobTitle: string;
  companyName: string;
  assessmentTitle: string;
  totalMarks?: number | null;
  durationMinutes?: number | null;
  dueAt?: Date | string | null;
  assessmentUrl: string;
}): { subject: string; html: string } {
  const {
    studentName,
    jobTitle,
    companyName,
    assessmentTitle,
    totalMarks,
    durationMinutes,
    dueAt,
    assessmentUrl,
  } = params;

  const dueLabel = formatDhakaDateTime(dueAt, 'No deadline set');

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;
                     background:#EFF6FF;
                     color:#1D4ED8;
                     font-size:10px;font-weight:700;
                     letter-spacing:1.4px;text-transform:uppercase;
                     padding:5px 13px;border-radius:6px;
                     border:1px solid #93C5FD;">
          Assessment Assigned
        </span>
      </td>
    </tr>

    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;font-weight:500;">
          Dear ${studentName},
        </p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;
                   letter-spacing:-0.4px;line-height:1.25;">
          Your assessment is ready
        </h1>
      </td>
    </tr>

    <tr>
      <td style="padding:12px 40px 0;">
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          ${companyName} has assigned you an assessment for <strong>${jobTitle}</strong>.
          Please review the instructions carefully and complete it before the due time.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Assessment', value: assessmentTitle },
          { label: 'Position', value: jobTitle },
          { label: 'Organisation', value: companyName },
          { label: 'Due date and time', value: dueLabel },
          { label: 'Total marks', value: `${totalMarks ?? 'N/A'}` },
          {
            label: 'Duration',
            value:
              typeof durationMinutes === 'number' ? `${durationMinutes} minutes` : 'Not specified',
          },
        ])}
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          This assessment is part of the hiring evaluation for this role. If the test has a fixed
          duration, the timer will start when you begin and will continue counting even if you leave
          the page and return later.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Make sure you start only when you are ready, and keep enough uninterrupted time to finish
          the attempt before the deadline and timer limit.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 0;">
        ${calloutBox(
          `Action required: open your Nextern assessment workspace and submit your answers before ${dueLabel}.`,
          '#EFF6FF',
          '#3B82F6',
          '#1E3A8A'
        )}
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0;color:#64748B;font-size:13px;line-height:1.8;">
          You can open the assessment directly from your Nextern dashboard and review any employer
          instructions there.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('Open My Assessment', assessmentUrl, '#2563EB')}
      </td>
    </tr>
  `,
    '#3B82F6'
  );

  return {
    subject: `Assessment assigned — ${jobTitle} at ${companyName}`,
    html,
  };
}

// ── Deadline reminder ──────────────────────────────────────────────────────
export function deadlineReminderEmailTemplate(params: {
  studentName: string;
  jobTitle: string;
  companyName: string;
  deadline: Date;
  daysLeft: number;
}): { subject: string; html: string } {
  const { studentName, jobTitle, companyName, deadline, daysLeft } = params;
  const dayLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  const deadlineLabel = deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#FEF3C7;color:#92400E;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Deadline Reminder
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${studentName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Application deadline approaching
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Position', value: jobTitle },
          { label: 'Organisation', value: companyName },
          { label: 'Closing Date', value: deadlineLabel },
          { label: 'Time Remaining', value: dayLabel },
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          This is a formal reminder that the application deadline for <strong>${jobTitle}</strong> at
          <strong>${companyName}</strong> is closing in <strong>${dayLabel}</strong>.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          If you have not yet submitted your application, we strongly encourage you to do so before
          the deadline passes. Incomplete or late submissions will not be considered.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          'Please log in to your Nextern account to review the full role details and submit your application before the closing date.',
          '#FFFBEB',
          '#F59E0B',
          '#92400E'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0;color:#64748B;font-size:13px;line-height:1.8;">
          You can manage your saved opportunities at
          <span style="color:#1A202C;font-weight:600;">${getAppUrl()}/student/jobs</span>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('View Opportunity', `${getAppUrl()}/student/jobs`, '#D97706')}
      </td>
    </tr>
  `,
    '#F59E0B'
  );

  return {
    subject: `Deadline reminder — ${jobTitle} closes in ${dayLabel}`,
    html,
  };
}

// ── Hosted event reminder (for advisors / dept heads) ─────────────────────
export function hostedEventReminderEmailTemplate(params: {
  recipientName: string;
  eventTitle: string;
  organizationName: string;
  eventDate: Date;
  daysLeft: number;
  kind: 'registration_deadline' | 'event_start';
}): { subject: string; html: string } {
  const { recipientName, eventTitle, organizationName, eventDate, daysLeft, kind } = params;
  const dateLabel = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const dayLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  const isRegDeadline = kind === 'registration_deadline';
  const headline = isRegDeadline ? 'Registration deadline approaching' : 'Upcoming event reminder';
  const subject = isRegDeadline
    ? `Registration closes in ${dayLabel} — ${eventTitle}`
    : `Event begins in ${dayLabel} — ${eventTitle}`;
  const detailLabel = isRegDeadline ? 'Registration Deadline' : 'Event Date';
  const bodyText = isRegDeadline
    ? `Registration for <strong>${eventTitle}</strong> is scheduled to close in <strong>${dayLabel}</strong>.
       Please ensure any final administrative steps are completed before that date, and that
       registered participants have been informed of the upcoming closure.`
    : `Your event <strong>${eventTitle}</strong>, organised by <strong>${organizationName}</strong>,
       is scheduled to begin in <strong>${dayLabel}</strong>. Please review your registrant list,
       confirm all logistical arrangements, and prepare any materials required for the session.`;

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#EDE9FE;color:#5B21B6;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          ${isRegDeadline ? 'Registration Reminder' : 'Event Reminder'}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${recipientName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          ${headline}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Event', value: eventTitle },
          { label: 'Organisation', value: organizationName },
          { label: detailLabel, value: dateLabel },
          { label: 'Time Remaining', value: dayLabel },
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">${bodyText}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          'Please review your Nextern dashboard for registrant details, communications, and any final preparation steps.',
          '#EDE9FE',
          '#8B5CF6',
          '#4C1D95'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('Go to Dashboard', `${getAppUrl()}/advisor/dashboard`, '#7C3AED')}
      </td>
    </tr>
  `,
    '#8B5CF6'
  );

  return { subject, html };
}

// ── Event registration confirmation ───────────────────────────────────────
export function eventRegistrationConfirmationEmailTemplate(params: {
  studentName: string;
  eventTitle: string;
  organizationName: string;
  eventDate: Date;
}): { subject: string; html: string } {
  const { studentName, eventTitle, organizationName, eventDate } = params;
  const dateLabel = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#ECFDF5;color:#065F46;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Registration Confirmed
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${studentName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Your registration is confirmed
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Event', value: eventTitle },
          { label: 'Organisation', value: organizationName },
          { label: 'Event Date', value: dateLabel },
          { label: 'Status', value: 'Registered' },
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          Your registration for <strong>${eventTitle}</strong>, hosted by <strong>${organizationName}</strong>,
          has been successfully recorded. A place has been reserved for you at this event.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          The event is scheduled for <strong>${dateLabel}</strong>. Please reserve this date in your
          personal calendar. We will send a reminder closer to the event date with any final
          details or preparation materials from the organiser.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          'No further action is required at this stage. You will be notified if any details change or if additional information is required from you.',
          '#ECFDF5',
          '#10B981',
          '#065F46'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('View My Registrations', `${getAppUrl()}/student/applications`, '#059669')}
      </td>
    </tr>
  `,
    '#10B981'
  );

  return {
    subject: `Registration confirmed — ${eventTitle}`,
    html,
  };
}

// ── Registered event reminder (for students) ──────────────────────────────
export function registeredEventReminderEmailTemplate(params: {
  studentName: string;
  eventTitle: string;
  organizationName: string;
  eventDate: Date;
  daysLeft: number;
}): { subject: string; html: string } {
  const { studentName, eventTitle, organizationName, eventDate, daysLeft } = params;
  const dateLabel = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const dayLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#F0F9FF;color:#0369A1;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Event Reminder
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${studentName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Your event is coming up soon
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: 'Event', value: eventTitle },
          { label: 'Organisation', value: organizationName },
          { label: 'Date', value: dateLabel },
          { label: 'Time Remaining', value: dayLabel },
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          This is a reminder that <strong>${eventTitle}</strong>, for which you are registered,
          is scheduled to begin in <strong>${dayLabel}</strong>.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Please review any preparation materials that may have been provided by the organiser
          and ensure you are ready to participate fully on the day of the event.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          `Mark your calendar for ${dateLabel}. Attendance details and any joining instructions will be available in your Nextern dashboard.`,
          '#F0F9FF',
          '#0EA5E9',
          '#0C4A6E'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('View Event Details', `${getAppUrl()}/student/applications`, '#0284C7')}
      </td>
    </tr>
  `,
    '#0EA5E9'
  );

  return {
    subject: `Event reminder — ${eventTitle} begins in ${dayLabel}`,
    html,
  };
}

// ── OTP email ──────────────────────────────────────────────────────────────
export function employerApplicationNotificationEmailTemplate(params: {
  employerName: string;
  studentName: string;
  opportunityTitle: string;
  organizationName: string;
  isEventRegistration?: boolean;
}): { subject: string; html: string } {
  const { employerName, studentName, opportunityTitle, organizationName, isEventRegistration } =
    params;
  const isRegistration = isEventRegistration === true;
  const dashboardUrl = `${getAppUrl()}/employer/dashboard`;

  const html = emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          ${isRegistration ? 'Event Registration' : 'Job Application'}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${employerName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          ${isRegistration ? 'A new registration has been received' : 'A new application has been received'}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        ${infoTable([
          { label: isRegistration ? 'Registrant' : 'Applicant', value: studentName },
          { label: isRegistration ? 'Event' : 'Opportunity', value: opportunityTitle },
          { label: 'Organisation', value: organizationName },
          { label: 'Status', value: isRegistration ? 'Registered' : 'Applied' },
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 0;">
        <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.85;">
          <strong>${studentName}</strong> has ${isRegistration ? 'registered for' : 'applied to'} <strong>${opportunityTitle}</strong> through Nextern.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          Please review the submission details from your dashboard and take the appropriate next step when convenient.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          isRegistration
            ? 'Use your employer dashboard to review registrant details and event interest.'
            : 'Use your employer dashboard to review applicant fit, resume details, and pipeline status.',
          '#EFF6FF',
          '#2563EB',
          '#1E3A8A'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton(
          isRegistration ? 'View Registrations' : 'View Applicants',
          dashboardUrl,
          '#2563EB'
        )}
      </td>
    </tr>
  `,
    '#2563EB'
  );

  return {
    subject: isRegistration
      ? `New event registration â€” ${opportunityTitle}`
      : `New job application â€” ${opportunityTitle}`,
    html,
  };
}

export function otpEmailTemplate(otp: string, name: string): string {
  return emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Email Verification
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Hi ${name},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Verify your email address
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.85;">
          To complete your Nextern registration, please use the verification code below.
          This code is valid for <strong>10 minutes</strong> and may only be used once.
        </p>
        <div style="background:#F8FAFC;border:1.5px dashed #2563EB;border-radius:14px;
                    padding:28px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 10px;color:#64748B;font-size:11px;
                    text-transform:uppercase;letter-spacing:2px;font-weight:700;">
            Your Verification Code
          </p>
          <p style="margin:0;color:#0F172A;font-size:38px;font-weight:800;letter-spacing:12px;">
            ${otp}
          </p>
        </div>
        <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;line-height:1.7;">
          For your security, never share this code with anyone. Nextern will never request your
          verification code via phone, chat, or any other channel.
        </p>
        <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.7;">
          If you did not initiate this request, you may safely disregard this message.
        </p>
      </td>
    </tr>
    <tr><td style="padding:0 0 40px;"></td></tr>
  `,
    '#2563EB'
  );
}

// ── Welcome email ──────────────────────────────────────────────────────────
export function passwordResetOtpEmailTemplate(otp: string, name: string): string {
  return emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Password Reset
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Hi ${name},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Reset your password
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.85;">
          Use the security code below to reset your Nextern password. This code is valid for
          <strong>10 minutes</strong> and may only be used once.
        </p>
        <div style="background:#F8FAFC;border:1.5px dashed #2563EB;border-radius:14px;
                    padding:28px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 10px;color:#64748B;font-size:11px;
                    text-transform:uppercase;letter-spacing:2px;font-weight:700;">
            Your Password Reset Code
          </p>
          <p style="margin:0;color:#0F172A;font-size:38px;font-weight:800;letter-spacing:12px;">
            ${otp}
          </p>
        </div>
        <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.7;">
          If you did not request a password reset, disregard this message. Never share this code
          with anyone.
        </p>
      </td>
    </tr>
    <tr><td style="padding:0 0 40px;"></td></tr>
  `,
    '#2563EB'
  );
}

export function welcomeEmailTemplate(name: string, role: string): string {
  const loginUrl = getLoginUrl();
  const roleMessages: Record<string, string> = {
    student:
      'Your account is ready. Start building your academic profile and discover internships that match your skills, qualifications, and career goals.',
    employer:
      'Your employer account has been submitted and is currently under review by our team. You will receive a notification once your account is approved and you are able to begin posting opportunities.',
    advisor:
      'Your advisor account has been submitted and is pending administrative approval. You will be notified once your account is activated.',
    dept_head:
      'Your department head account has been submitted and is pending administrative approval. You will be notified once your account is activated.',
  };

  return emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#ECFDF5;color:#065F46;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Welcome to Nextern
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${name},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Your account has been created
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.85;">
          ${roleMessages[role] || 'Your Nextern account has been successfully created. Welcome to the platform.'}
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          You may sign in to your account at any time using your registered email address at
          <span style="color:#0F172A;font-weight:600;">${getAppUrl()}/login</span>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          'Keep your login credentials secure and do not share your password with anyone. Nextern will never ask for your password via email.',
          '#F8FAFC',
          '#94A3B8',
          '#374151'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('Sign In to Nextern', loginUrl, '#2563EB')}
      </td>
    </tr>
  `,
    '#22D3EE'
  );
}

// ── Academic credential email ──────────────────────────────────────────────
export function academicCredentialEmailTemplate({
  recipientName,
  recipientRole,
  creatorName,
  email,
  temporaryPassword,
  institutionName,
  advisoryDepartment,
}: {
  recipientName: string;
  recipientRole: 'advisor' | 'dept_head';
  creatorName: string;
  email: string;
  temporaryPassword: string;
  institutionName: string;
  advisoryDepartment: string;
}): string {
  const roleLabel = recipientRole === 'dept_head' ? 'Department Head' : 'Academic Advisor';
  const loginUrl = getLoginUrl();

  return emailWrapper(
    `
    <tr>
      <td style="padding:36px 40px 0;">
        <span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;
                     font-size:10px;font-weight:700;letter-spacing:1.4px;
                     text-transform:uppercase;padding:5px 13px;border-radius:6px;">
          Account Credentials
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 40px 0;">
        <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Dear ${recipientName},</p>
        <h1 style="margin:0;color:#0F172A;font-size:26px;font-weight:800;letter-spacing:-0.4px;">
          Your ${roleLabel} account is ready
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="height:1px;background:#E2E8F0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.85;">
          <strong>${creatorName}</strong> has created a <strong>${roleLabel}</strong> account for
          you on the Nextern Career Readiness Platform. Your initial sign-in credentials are provided below.
        </p>
        ${infoTable([
          { label: 'Institution', value: institutionName },
          { label: 'Department', value: advisoryDepartment },
          { label: 'Role', value: roleLabel },
          { label: 'Email Address', value: email },
          { label: 'Temporary Password', value: temporaryPassword },
        ])}
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.85;">
          For security purposes, you will be prompted to create a new password immediately upon
          your first successful login. Please do this as soon as possible.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0;">
        ${calloutBox(
          'These credentials are confidential. Do not share your temporary password with anyone. If you were not expecting this account, please contact your institution administrator before proceeding.',
          '#FEF3C7',
          '#F59E0B',
          '#92400E'
        )}
      </td>
    </tr>
    <tr>
      <td style="padding:4px 40px 40px;">
        ${ctaButton('Sign In and Set Password', loginUrl, '#2563EB')}
      </td>
    </tr>
  `,
    '#2563EB'
  );
}
