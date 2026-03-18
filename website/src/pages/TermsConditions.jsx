import { motion } from 'framer-motion';
import SEO from '../components/SEO';

export default function TermsConditions() {
  return (
    <>
      <SEO title="Terms & Conditions" description="Terms and conditions for using Taqon Electrico services." />

      <section className="relative bg-taqon-dark pt-28 pb-12">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Legal</span>
            <h1 className="mt-3 text-4xl font-bold font-syne text-white">Terms & Conditions</h1>
            <p className="mt-3 text-white/50">Last updated: March 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-taqon-charcoal/80 dark:text-white/70">

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">1. Agreement to Terms</h2>
              <p>By accessing or using the Taqon Electrico website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">2. Services</h2>
              <p>Taqon Electrico provides solar energy solutions including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Solar panel installation (residential, commercial, and institutional)</li>
                <li>Solar system design and consultation</li>
                <li>Equipment sales (panels, inverters, batteries, accessories)</li>
                <li>Maintenance and repair services</li>
                <li>Online quotation and configuration tools</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">3. Quotations & Pricing</h2>
              <p>All quotations provided through our website or by our sales team are valid for 30 days from the date of issue unless otherwise stated. Prices are quoted in USD and are subject to change based on market conditions, exchange rate fluctuations, and component availability.</p>
              <p>A 50% deposit is required to commence any installation work. The remaining balance is due upon completion of the installation.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">4. Installation & Warranty</h2>
              <p>Installation timelines are confirmed upon acceptance of the quotation and receipt of the deposit. Taqon Electrico provides workmanship warranty on all installations. Product warranties are as per the manufacturer's terms and conditions.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Solar panels: Manufacturer warranty (typically 25 years performance)</li>
                <li>Inverters: Manufacturer warranty (typically 5-10 years)</li>
                <li>Batteries: Manufacturer warranty (typically 5-10 years)</li>
                <li>Workmanship: 2 years from date of installation</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">5. Online Shop</h2>
              <p>Products purchased through our online shop are subject to availability. We reserve the right to cancel orders if products are unavailable. Payment must be received in full before dispatch of goods.</p>
              <p>Returns are accepted within 14 days of delivery for unopened, undamaged products. Shipping costs for returns are the responsibility of the customer unless the product is defective.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">6. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. Taqon Electrico is not liable for any loss arising from unauthorized use of your account.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">7. Intellectual Property</h2>
              <p>All content on this website including text, images, logos, designs, and software is the property of Taqon Electrico and is protected by copyright law. You may not reproduce, distribute, or create derivative works without our written consent.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">8. Limitation of Liability</h2>
              <p>Taqon Electrico shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services or website. Our total liability shall not exceed the amount paid by you for the specific service or product in question.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">9. Governing Law</h2>
              <p>These terms are governed by the laws of the Republic of Zimbabwe. Any disputes shall be resolved through the courts of Zimbabwe.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">10. Contact</h2>
              <p>For questions about these terms, contact us at:</p>
              <p>Taqon Electrico<br />Harare, Zimbabwe<br />Phone: +263 77 277 1036<br />Email: info@taqon.co.zw</p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
