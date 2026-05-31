import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — ig-bio",
};

const LAST_UPDATED = "May 31, 2026";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-sm text-gray-900 bg-white">
      <Link href="/" className="text-gray-500 hover:text-gray-800 text-xs mb-8 inline-block">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold mb-1 text-gray-900">Terms of Service</h1>
      <p className="text-gray-500 text-xs mb-10">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Acceptance">
        <p>
          By connecting your Instagram account or using ig-bio in any way, you agree to these Terms
          of Service. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>
          ig-bio is a link-in-bio tool that connects to your Instagram Professional account via the
          Instagram Graph API. It periodically fetches your posts, filters them by a trigger phrase
          you configure, and displays them as a clickable grid at a public URL. Each post card links
          to a URL extracted from your post caption.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least 13 years old to use the Service.</li>
          <li>
            You must own or have authorisation to connect the Instagram account you link to the
            Service.
          </li>
          <li>
            Your Instagram account must be a Professional account (Business or Creator) as required
            by the Instagram Graph API.
          </li>
        </ul>
      </Section>

      <Section title="4. Instagram Platform Policy Compliance">
        <p>
          The Service accesses Instagram data through Meta&apos;s official Instagram Graph API. Your
          use of the Service is also subject to:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            <a
              href="https://developers.facebook.com/policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Meta Platform Terms
            </a>
          </li>
          <li>
            <a
              href="https://help.instagram.com/581066165581870"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instagram Community Guidelines
            </a>
          </li>
          <li>
            <a
              href="https://help.instagram.com/478745558852511"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instagram Terms of Use
            </a>
          </li>
        </ul>
        <p className="mt-3">
          You are solely responsible for ensuring that the content published through your ig-bio
          page complies with all applicable Meta policies and laws.
        </p>
      </Section>

      <Section title="5. Your Responsibilities">
        <ul className="list-disc pl-5 space-y-1">
          <li>You are responsible for all content that appears on your ig-bio page.</li>
          <li>
            You must not use the Service to distribute illegal content, spam, malware, or content
            that infringes third-party intellectual property rights.
          </li>
          <li>
            You must not attempt to reverse-engineer, scrape, or abuse the Service or its
            infrastructure.
          </li>
          <li>
            You must keep your trigger phrase and account settings accurate and up to date.
          </li>
        </ul>
      </Section>

      <Section title="6. Access Tokens and Data">
        <p>
          To operate the Service, we store an Instagram access token issued to your account. You can
          revoke this access at any time via Instagram Settings → Apps and Websites. Revoking access
          will cause your ig-bio page to stop syncing new posts, and you may request deletion of
          your stored data by contacting us.
        </p>
      </Section>

      <Section title="7. Service Availability">
        <p>
          We provide the Service on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We
          do not guarantee uninterrupted or error-free operation. The Service depends on the
          Instagram Graph API; any changes Meta makes to that API may affect functionality without
          notice.
        </p>
        <p className="mt-3">
          We reserve the right to modify, suspend, or discontinue the Service at any time with
          reasonable notice where practicable.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>
          The ig-bio application code, design, and branding are our intellectual property. Your
          Instagram content remains yours — we do not claim ownership of any posts, images, or
          captions fetched through the API.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, ig-bio and its operators shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages arising from your
          use of or inability to use the Service, including but not limited to loss of data, loss of
          revenue, or reputational harm.
        </p>
        <p className="mt-3">
          Our total liability to you for any claim arising from these Terms or the Service shall not
          exceed the amount you paid us in the 12 months preceding the claim (or $10 if you have
          paid nothing).
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We may suspend or terminate your access to the Service immediately if you breach these
          Terms, violate Meta&apos;s platform policies, or if we are required to do so by law.
        </p>
        <p className="mt-3">
          You may terminate your account at any time by revoking ig-bio&apos;s access via Instagram
          and requesting data deletion at the contact address below.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms are governed by and construed in accordance with applicable law. Any disputes
          shall be resolved in the courts of the jurisdiction in which we operate. If any provision
          of these Terms is found to be unenforceable, the remaining provisions remain in full
          effect.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          For questions about these Terms, contact us at{" "}
          <a href="mailto:darijavan@gmail.com" className="underline">
            darijavan@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we will update the &ldquo;Last
          updated&rdquo; date above. Continued use of the Service after changes constitutes
          acceptance of the revised Terms.
        </p>
      </Section>

      <footer className="mt-12 pt-6 border-t border-gray-200 flex gap-6 text-xs text-gray-500">
        <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
        <Link href="/" className="hover:text-gray-900">Home</Link>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-800 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
