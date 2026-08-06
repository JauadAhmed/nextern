import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy | Nextern' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      introduction="This policy explains how Nextern collects and uses personal information when students, employers, academic users, mentors, freelancers, and administrators use the platform."
      sections={[
        {
          heading: 'Information we collect',
          paragraphs: [
            'We collect account details such as name, email, phone number, role, institution or company information, and verification data. Depending on the features you use, we may also process resumes, skills, applications, projects, messages, reviews, assessments, interview details, calendar events, and payment references.',
            'We collect technical information needed to operate and secure the service, such as device and browser data, IP address, timestamps, authentication events, and diagnostic logs. Payment providers process sensitive payment credentials under their own privacy terms; Nextern stores only the references and transaction details needed to reconcile platform activity.',
          ],
        },
        {
          heading: 'How information is used',
          paragraphs: [
            'Information is used to provide role-appropriate features, authenticate users, match students with opportunities, process applications and transactions, deliver notifications, prevent abuse, support users, and improve service reliability.',
            'Profile or application information is shared with other platform participants only when required by the feature you use—for example, an application shared with the relevant employer or academic information shared with an assigned advisor.',
          ],
        },
        {
          heading: 'Storage, security, and retention',
          paragraphs: [
            'Nextern uses access controls, password hashing, encrypted connections, and operational safeguards designed to protect personal information. No internet service can guarantee absolute security, so users should also protect their credentials and report suspicious activity promptly.',
            'Information is retained while an account is active and for as long as reasonably required for platform operations, dispute resolution, fraud prevention, recordkeeping, or legal obligations. Data that is no longer required is deleted or de-identified where practical.',
          ],
        },
        {
          heading: 'Service providers and legal disclosures',
          paragraphs: [
            'We may use vetted providers for hosting, email delivery, authentication, analytics, file storage, calendar connections, and payments. They receive only the information needed to provide their contracted service.',
            'Information may be disclosed when required by law, to protect users or the platform, to investigate fraud or security incidents, or as part of a lawful business transfer with appropriate safeguards.',
          ],
        },
        {
          heading: 'Your choices and rights',
          paragraphs: [
            'You can update many profile and notification settings from your account. You may request access, correction, or deletion of personal information by contacting support, subject to identity verification and any records Nextern must retain by law or for legitimate operational needs.',
            'Connected services, such as Google Calendar, can be disconnected through the relevant account settings. You can also adjust email and in-app notification preferences where those controls are available.',
          ],
        },
        {
          heading: 'Updates to this policy',
          paragraphs: [
            'This policy may be updated to reflect changes to Nextern features, providers, or legal requirements. Material changes will be communicated through the platform or registered contact details, and the effective date above will be updated.',
          ],
        },
      ]}
    />
  );
}
