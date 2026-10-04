import { Link } from '@/lib/router';
import { Heart, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'privacy';
}

export default function LegalPage({ type }: LegalPageProps) {
  const isTerms = type === 'terms';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/signup" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to sign up
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Hatis</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: October 2026</p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 prose prose-slate max-w-none">
          {isTerms ? (
            <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
              <Section title="1. About Hatis">
                Hatis is a discovery and support platform for Haitian creators. It helps
                fans find creators, follow their work, and support them directly using
                the payment methods the creators already use. Hatis does not process,
                hold, or transfer any payments. All support goes directly from the fan
                to the creator through their own payment accounts.
              </Section>

              <Section title="2. Eligibility">
                You must be 18 years or older to use Hatis. By creating an account, you
                confirm that you meet this requirement.
              </Section>

              <Section title="3. Creator Pages">
                Creators are responsible for the accuracy of the information on their
                pages, including payment handles, social links, and profile content.
                Hatis is not responsible for payments sent to incorrect or outdated
                payment information. Always verify you are supporting the right creator
                before sending money.
              </Section>

              <Section title="4. Verification">
                Hatis may verify creators at its discretion. A verified badge means
                Hatis has confirmed the creator's identity. Unverified pages may still
                belong to real creators but have not been confirmed by Hatis.
              </Section>

              <Section title="5. Prohibited Content">
                Pages that contain fraudulent payment information, impersonate another
                person, or violate applicable laws will be unpublished. Hatis reserves
                the right to remove any content or page that violates these terms.
              </Section>

              <Section title="6. Reporting">
                If you find a page with incorrect payment information, impersonation, or
                suspicious activity, please report it. Hatis will investigate and take
                appropriate action.
              </Section>

              <Section title="7. Limitation of Liability">
                Hatis is a directory and discovery platform. We do not handle payments
                and are not responsible for any financial transactions between fans and
                creators. Hatis is provided "as is" without warranties of any kind.
              </Section>

              <Section title="8. Changes to Terms">
                Hatis may update these terms from time to time. Continued use of the
                platform after changes constitutes acceptance of the new terms.
              </Section>
            </div>
          ) : (
            <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
              <Section title="1. Information We Collect">
                When you sign up with Google or Facebook, we receive your name and email
                address from the OAuth provider. If you create a creator page, we store
                the profile information you provide, including your bio, category,
                location, and payment method handles.
              </Section>

              <Section title="2. How We Use Your Information">
                We use your information to create and maintain your Hatis profile,
                display your page to visitors, and provide analytics about support
                clicks. We do not sell your data to third parties.
              </Section>

              <Section title="3. Payment Information">
                Hatis displays payment method handles (such as MonCash numbers, PayPal
                usernames, or Cash App tags) that you provide. These are displayed
                publicly so fans can support you directly. Hatis does not store or
                process any payment credentials.
              </Section>

              <Section title="4. Data Storage">
                Your data is stored securely using Supabase. Profile images are stored
                in a public bucket for fast loading. Your email address is not displayed
                publicly on your creator page.
              </Section>

              <Section title="5. Cookies and Authentication">
                We use authentication tokens to keep you logged in. These are stored
                securely and are not shared with third parties.
              </Section>

              <Section title="6. Your Rights">
                You can update your profile information at any time. You can delete your
                creator page, which will remove your public profile. Your account data
                can be requested by contacting us.
              </Section>

              <Section title="7. Data Retention">
                Your profile data is retained while your account is active. When you
                delete your account, your profile and creator page data are removed.
              </Section>

              <Section title="8. Contact">
                For privacy questions or requests, please contact us through the report
                system or your account settings.
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-900 mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
