import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service | Nextern' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      introduction="These terms govern access to Nextern, including student career tools, employer recruitment services, academic advising features, mentorship, and freelance services. By creating an account or using the platform, you agree to these terms."
      sections={[
        {
          heading: 'Account responsibilities',
          paragraphs: [
            'You must provide accurate account information, keep your credentials secure, and promptly update information that becomes inaccurate. You are responsible for activity performed through your account.',
            'Academic and employer accounts may require verification or approval. Nextern may restrict an account when information is misleading, access is unauthorized, or platform safety is at risk.',
          ],
        },
        {
          heading: 'Platform use',
          paragraphs: [
            'Students, employers, advisors, department heads, mentors, and administrators may only use features permitted for their assigned role. Job posts, applications, messages, reviews, assessments, and portfolio material must be lawful, accurate, and relevant to career or academic activity.',
            'You may not scrape the service, bypass access controls, impersonate another person or organization, upload harmful content, manipulate reviews, or use the platform to discriminate or mislead applicants.',
          ],
        },
        {
          heading: 'Jobs, mentorship, and freelance services',
          paragraphs: [
            'Nextern provides tools that help participants connect. Employers remain responsible for job descriptions, hiring decisions, workplace obligations, and compliance with applicable law. Mentors and freelance participants remain responsible for the services and commitments they make.',
            'Payments, subscriptions, refunds, and escrow releases are subject to the terms shown during the relevant transaction. Nextern does not guarantee employment, selection, academic outcomes, or freelance earnings.',
          ],
        },
        {
          heading: 'Content and intellectual property',
          paragraphs: [
            'You retain ownership of content you submit. You grant Nextern the limited permission needed to host, process, display, and transmit that content to operate the service and fulfill actions you request.',
            'The Nextern name, software, interface, and original platform materials may not be copied or commercially reused without permission.',
          ],
        },
        {
          heading: 'Suspension, availability, and liability',
          paragraphs: [
            'Access may be suspended or ended for material violations, fraud, security risk, or legal requirements. We may maintain, update, or temporarily interrupt the service and will take reasonable steps to protect continuity.',
            'To the extent allowed by applicable law, Nextern is not liable for indirect losses or decisions made independently by users. Nothing in these terms excludes rights or liabilities that cannot lawfully be excluded.',
          ],
        },
        {
          heading: 'Changes and governing requirements',
          paragraphs: [
            'We may update these terms when the service or legal requirements change. Material updates will be communicated through the platform or registered contact details. Continued use after an update means the revised terms apply.',
            'These terms are intended to operate consistently with the applicable laws of Bangladesh. Any mandatory consumer, employment, privacy, or other statutory protections continue to apply.',
          ],
        },
      ]}
    />
  );
}
