import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Hearline',
  description: 'Terms of Service and User Agreement for Hearline AI-powered cardiac management platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600">
              Last updated: June 8, 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using Hearline's AI-powered cardiac management platform ("Service"), 
                you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              <p className="text-gray-600">
                These Terms of Service ("Terms") govern your use of our website and software platform 
                operated by Hearline, Inc. ("us", "we", or "our").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                Hearline provides an AI-powered platform for cardiac care management, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>ECG analysis and interpretation using artificial intelligence</li>
                <li>Workflow automation and integration tools</li>
                <li>Patient data management and reporting</li>
                <li>Clinical decision support systems</li>
                <li>Analytics and performance monitoring</li>
              </ul>
              <p className="text-gray-600">
                Our Service is intended for use by qualified healthcare professionals and institutions 
                in the diagnosis and treatment of cardiac conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Medical Disclaimer</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                <p className="text-gray-800 font-medium mb-2">Important Medical Disclaimer:</p>
                <p className="text-gray-700">
                  Hearline's AI analysis and recommendations are intended to support, not replace, 
                  clinical judgment. Healthcare professionals must exercise their own clinical 
                  judgment and expertise when making diagnostic and treatment decisions.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Our AI is a diagnostic aid and should not be used as the sole basis for medical decisions</li>
                <li>Always verify AI recommendations with clinical assessment</li>
                <li>Emergency situations require immediate clinical intervention, not AI analysis</li>
                <li>Healthcare providers remain fully responsible for patient care decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Eligibility and Registration</h2>
              <p className="text-gray-600 mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Be a licensed healthcare professional or authorized healthcare institution</li>
                <li>Have the authority to enter into this agreement</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
              <p className="text-gray-600 mb-4">
                Patient data privacy and security are paramount. Our Service:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Complies with HIPAA and other applicable privacy regulations</li>
                <li>Uses end-to-end encryption for all data transmission and storage</li>
                <li>Implements comprehensive access controls and audit trails</li>
                <li>Never shares patient data without explicit authorization</li>
                <li>Provides data portability and deletion capabilities</li>
              </ul>
              <p className="text-gray-600">
                For detailed information about our data practices, please review our 
                <a href="/privacy" className="text-blue-600 hover:underline"> Privacy Policy</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Acceptable Use</h2>
              <p className="text-gray-600 mb-4">You agree to use our Service only for:</p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Legitimate healthcare purposes</li>
                <li>Compliance with all applicable laws and professional standards</li>
                <li>Authorized access to patient information</li>
                <li>Proper clinical workflow integration</li>
              </ul>
              <p className="text-gray-600 mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Use the Service for unauthorized or illegal purposes</li>
                <li>Attempt to reverse engineer or compromise our systems</li>
                <li>Share access credentials with unauthorized individuals</li>
                <li>Upload malicious code or attempt to disrupt the Service</li>
                <li>Violate patient privacy or professional ethics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                All intellectual property rights in the Service, including AI algorithms, 
                software, documentation, and trademarks, remain the property of Hearline, Inc.
              </p>
              <p className="text-gray-600">
                Patient data uploaded to the Service remains the property of the healthcare 
                provider, subject to our data processing agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-600 mb-4">
                We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. 
                We may temporarily suspend service for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Scheduled maintenance and updates</li>
                <li>Emergency security measures</li>
                <li>Compliance with legal requirements</li>
                <li>Technical issues beyond our control</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <p className="text-red-800 font-medium mb-2">Important Liability Limitation:</p>
                <p className="text-red-700">
                  To the maximum extent permitted by law, Hearline's liability is limited to 
                  the amount paid for the Service in the 12 months preceding the claim.
                </p>
              </div>
              <p className="text-gray-600">
                We are not liable for indirect, incidental, special, or consequential damages, 
                including but not limited to lost profits, data loss, or business interruption.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-600 mb-4">
                Either party may terminate this agreement with 30 days' written notice. 
                We may terminate immediately for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Breach of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Illegal or unethical use of the Service</li>
                <li>Risk to patient safety or data security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600">
                We may update these Terms periodically. Significant changes will be communicated 
                with 30 days' notice. Continued use of the Service constitutes acceptance of 
                updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Hearline, Inc.</strong><br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94107<br />
                  Email: legal@hearline.ai<br />
                  Phone: +1 (555) HEARLINE
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
