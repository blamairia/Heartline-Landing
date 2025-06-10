import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | Heartline',
  description: 'Privacy Policy for Heartline AI-powered cardiac management platform. Learn how we protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
        <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-xl text-gray-600">
                Last updated: June 8, 2025
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                At Heartline, Inc. ("we," "our," or "us"), we are committed to protecting the privacy 
                and security of personal and health information. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard information when you use our AI-powered cardiac 
                management platform.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <p className="text-blue-800 font-medium mb-2">Our Commitment:</p>
                <p className="text-blue-700">
                  Patient privacy is fundamental to our mission. We implement industry-leading 
                  security measures and comply with all applicable privacy regulations, including 
                  HIPAA, GDPR, and state privacy laws.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Protected Health Information (PHI)</h3>
              <p className="text-gray-600 mb-4">
                We process PHI only as a Business Associate under HIPAA when providing services 
                to covered entities. This may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>ECG data and cardiac test results</li>
                <li>Patient identifiers (name, date of birth, medical record numbers)</li>
                <li>Clinical notes and diagnostic information</li>
                <li>Treatment history and medication records</li>
                <li>Healthcare provider information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Account and Usage Information</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>User account details (name, email, professional credentials)</li>
                <li>Login and authentication information</li>
                <li>Usage patterns and platform interactions</li>
                <li>System performance and error logs</li>
                <li>Communication preferences and support interactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>IP addresses and device information</li>
                <li>Browser type and operating system</li>
                <li>Access times and referring websites</li>
                <li>API usage and integration data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Service Provision</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Provide AI-powered ECG analysis and diagnostic support</li>
                <li>Generate clinical reports and recommendations</li>
                <li>Facilitate workflow automation and system integration</li>
                <li>Maintain and improve platform performance</li>
                <li>Provide technical support and customer service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 AI Model Training and Improvement</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                <p className="text-green-800 font-medium mb-2">De-identified Data Only:</p>
                <p className="text-green-700">
                  We only use completely de-identified data for AI model training and research. 
                  All patient identifiers are removed before any data is used for these purposes.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Improve AI algorithm accuracy and performance</li>
                <li>Develop new diagnostic capabilities</li>
                <li>Conduct clinical research and validation studies</li>
                <li>Enhance platform features and functionality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 No Sale of Personal Information</h3>
              <p className="text-gray-600 mb-4">
                We do not sell, rent, or lease personal information or PHI to third parties.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Permitted Disclosures</h3>
              <p className="text-gray-600 mb-4">We may share information only in these limited circumstances:</p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> Trusted vendors who assist with platform operations (cloud hosting, security services)</li>
                <li><strong>Legal Compliance:</strong> When required by law, court order, or regulatory requirements</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions (with continued privacy protections)</li>
                <li><strong>Emergency Situations:</strong> To prevent harm to individuals or public safety</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Research and Publications</h3>
              <p className="text-gray-600">
                We may publish research findings using aggregated, de-identified data to advance 
                cardiac care. No individual patients or healthcare providers can be identified 
                in such publications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security Measures</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Technical Safeguards</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>End-to-end encryption for all data transmission</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Multi-factor authentication for all user accounts</li>
                <li>Regular security audits and penetration testing</li>
                <li>Automated threat detection and response systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Administrative Safeguards</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Role-based access controls and principle of least privilege</li>
                <li>Employee background checks and security training</li>
                <li>Incident response and breach notification procedures</li>
                <li>Regular risk assessments and compliance audits</li>
                <li>Business Associate Agreements with all vendors</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Physical Safeguards</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>SOC 2 Type II certified data centers</li>
                <li>24/7 physical security and monitoring</li>
                <li>Secure disposal of hardware and media</li>
                <li>Environmental controls and redundancy systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Individual Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 HIPAA Rights (for PHI)</h3>
              <p className="text-gray-600 mb-4">
                Patients have the right to request access, amendment, or restriction of their PHI 
                through their healthcare provider. We support covered entities in fulfilling these requests.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Account Holder Rights</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Access:</strong> Review your account information and usage data</li>
                <li><strong>Correction:</strong> Update inaccurate account information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Decline non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-600 mb-4">We retain information as follows:</p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>PHI:</strong> As directed by the covered entity, typically 6-7 years</li>
                <li><strong>Account Data:</strong> For the duration of the account plus 7 years</li>
                <li><strong>De-identified Data:</strong> May be retained indefinitely for research</li>
                <li><strong>System Logs:</strong> Typically 1-2 years for security and troubleshooting</li>
              </ul>
              <p className="text-gray-600">
                Data is securely deleted when retention periods expire or upon valid deletion requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-600 mb-4">
                Our primary data centers are located in the United States. For international 
                customers, we implement appropriate safeguards including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Standard Contractual Clauses (SCCs) where applicable</li>
                <li>Adequacy decisions and certification programs</li>
                <li>Local data residency options for sensitive jurisdictions</li>
                <li>Compliance with local privacy laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600">
                Our platform is designed for healthcare professionals and is not intended for 
                use by individuals under 18. We do not knowingly collect personal information 
                from children for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Privacy Policy Updates</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy periodically to reflect changes in our practices 
                or applicable law. Material changes will be communicated with at least 30 days' 
                notice to account holders.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For questions about this Privacy Policy or our privacy practices, please contact:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  <strong>Data Protection Officer</strong><br />
                  Heartline, Inc.<br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94107
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@Heartline.ai<br />
                  <strong>Phone:</strong> +1 (555) Heartline<br />                  <strong>Privacy Portal:</strong> privacy.Heartline.ai
                </p>              </div>
            </section>
          </div>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
