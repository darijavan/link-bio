import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — link-bio",
};

const LAST_UPDATED = "May 31, 2026";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-sm text-gray-900 bg-white">
      <Link href="/" className="text-gray-500 hover:text-gray-800 text-xs mb-8 inline-block">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold mb-1 text-gray-900">Privacy Policy</h1>
      <p className="text-gray-500 text-xs mb-10">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Overview">
        <p>
          link-bio (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the Service&rdquo;) is a link-in-bio
          tool that connects to your Instagram account and displays your posts on a public page. This
          policy explains what data we collect, how we use it, and your rights over it.
        </p>
      </Section>

      <Section title="2. Data We Collect">
        <p className="mb-3">When you connect your Instagram account, we collect and store:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your Instagram username and Instagram user ID</li>
          <li>An Instagram access token (used to fetch your posts on your behalf)</li>
          <li>
            The caption text, thumbnail image URL, and timestamp of posts that match your configured
            trigger phrase
          </li>
          <li>The outbound URL extracted from those captions</li>
          <li>The date and time of your last sync</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> collect your Instagram password, email address, follower list,
          direct messages, or any post data beyond what is described above.
        </p>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>To operate the Service:</strong> your access token is used solely to fetch your
            Instagram media via the Instagram Graph API.
          </li>
          <li>
            <strong>To display your public page:</strong> synced post thumbnails and links are shown
            at your public link-bio URL.
          </li>
          <li>
            <strong>To keep tokens valid:</strong> we refresh your Instagram access token before it
            expires (tokens last 60 days) so your page stays up to date without requiring you to
            reconnect.
          </li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell your data, use it for advertising, or share it with any
          third party beyond the infrastructure providers listed below.
        </p>
      </Section>

      <Section title="4. Third-Party Services">
        <p className="mb-3">
          The Service is built on the following third-party infrastructure, each with their own
          privacy policies:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Meta / Instagram Graph API</strong> — source of your Instagram post data. Your
            use of Instagram is governed by{" "}
            <a
              href="https://privacycenter.instagram.com/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Meta&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Vercel</strong> — hosts the application and processes web requests. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Vercel&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Neon / Supabase</strong> — stores your account data and synced posts in a
            PostgreSQL database hosted in the EU or US depending on your configuration.
          </li>
        </ul>
      </Section>

      <Section title="5. Data Retention">
        <p>
          We retain your data for as long as your account is active. If you disconnect your
          Instagram account or request deletion, we will delete your user record and all associated
          post data from our database within 30 days.
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          Instagram access tokens are stored in a private database and are never exposed in
          client-side code or public API responses. We use TLS for all data in transit. Access to
          the database is restricted to the application server.
        </p>
        <p className="mt-3">
          No system is perfectly secure. If you believe your data has been compromised, contact us
          immediately at the address below.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p className="mb-3">You may at any time:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Request a copy of the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and all associated data</li>
          <li>
            Revoke link-bio&apos;s access to your Instagram account via Instagram Settings →
            Apps and Websites
          </li>
        </ul>
        <p className="mt-3">To exercise any of these rights, contact us at the address in Section 9.</p>
      </Section>

      <Section title="8. Children">
        <p>
          The Service is not directed at children under 13. We do not knowingly collect data from
          anyone under 13. If you believe a child has provided us with personal data, contact us and
          we will delete it promptly.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For privacy-related requests or questions, contact us at{" "}
          <a href="mailto:darijavan@gmail.com" className="underline">
            darijavan@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this policy from time to time. When we do, we will update the &ldquo;Last
          updated&rdquo; date at the top of this page. Continued use of the Service after changes
          are posted constitutes your acceptance of the revised policy.
        </p>
      </Section>

      <footer className="mt-12 pt-6 border-t border-gray-200 flex gap-6 text-xs text-gray-500">
        <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
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
