import { motion } from 'framer-motion';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO title="Privacy Policy" description="How Taqon Electrico collects, uses, and protects your personal information." />

      <section className="relative bg-taqon-dark pt-28 pb-12">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Legal</span>
            <h1 className="mt-3 text-4xl font-bold font-syne text-white">Privacy Policy</h1>
            <p className="mt-3 text-white/50">Last updated: March 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-taqon-charcoal/80 dark:text-white/70">

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">1. Information We Collect</h2>
              <p>We collect information you provide directly when you:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create an account (name, email, phone number)</li>
                <li>Request a quotation (property details, energy usage, contact information)</li>
                <li>Make a purchase (billing address, payment information)</li>
                <li>Contact our support team (message content, ticket details)</li>
                <li>Use our Solar Advisor tool (appliance selections, location data)</li>
              </ul>
              <p className="mt-3">We automatically collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, features used)</li>
                <li>IP address and approximate location</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and improve our services</li>
                <li>To process orders, quotations, and payments</li>
                <li>To communicate with you about your account, orders, and services</li>
                <li>To send relevant notifications about your projects and installations</li>
                <li>To personalize your experience and recommend suitable solar solutions</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Our technicians and installation teams (to complete your project)</li>
                <li>Payment processors (Paynow, Stripe) to process transactions</li>
                <li>Cloud service providers (for data storage and hosting)</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">4. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>HTTPS encryption for all data in transit</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>JWT-based authentication with token rotation</li>
                <li>Access controls and role-based permissions</li>
                <li>Regular security audits</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">5. Cookies</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences (theme, language)</li>
                <li>Improve site performance through caching</li>
                <li>Understand how you use our website</li>
              </ul>
              <p className="mt-2">You can control cookies through your browser settings. Disabling cookies may affect some features of our website.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at info@taqon.co.zw or through your account settings.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">7. Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. Order and financial records are retained for 7 years as required by Zimbabwean tax law. You may request deletion of your account at any time.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">8. Third-Party Services</h2>
              <p>Our website may contain links to third-party services. We are not responsible for the privacy practices of these services. We encourage you to read their privacy policies.</p>
              <p className="mt-2">Third-party services we use include: Google (authentication, analytics), DigitalOcean (hosting), Neon (database), Paynow and Stripe (payments).</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">9. Children's Privacy</h2>
              <p>Our services are not directed to children under 18. We do not knowingly collect personal information from children.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">10. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of significant changes through our website or by email.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">11. Contact</h2>
              <p>For privacy-related questions or concerns:</p>
              <p>Taqon Electrico<br />Harare, Zimbabwe<br />Phone: +263 77 277 1036<br />Email: info@taqon.co.zw</p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
