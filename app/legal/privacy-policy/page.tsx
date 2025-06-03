import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Account Information:</strong> When you create an account, we collect your name, email address,
                  organization details, and authentication credentials.
                </p>
                <p>
                  <strong>Profile Data:</strong> We store user profile information including job titles, departments,
                  phone numbers, and signature preferences.
                </p>
                <p>
                  <strong>Usage Data:</strong> We collect information about how you use our service, including login
                  times, features accessed, and system interactions.
                </p>
                <p>
                  <strong>Technical Data:</strong> We automatically collect IP addresses, browser information, device
                  identifiers, and other technical data for security and performance purposes.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Service Delivery:</strong> To provide, maintain, and improve our email signature management
                  platform.
                </p>
                <p>
                  <strong>Authentication:</strong> To verify your identity and secure your account access.
                </p>
                <p>
                  <strong>Communication:</strong> To send you service-related notifications, updates, and support
                  responses.
                </p>
                <p>
                  <strong>Analytics:</strong> To understand usage patterns and improve our service performance.
                </p>
                <p>
                  <strong>Security:</strong> To detect, prevent, and respond to security threats and fraudulent
                  activities.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Within Your Organization:</strong> Your profile information and signature data may be visible
                  to other administrators within your organization.
                </p>
                <p>
                  <strong>Service Providers:</strong> We may share data with trusted third-party service providers who
                  assist in operating our platform (hosting, analytics, support).
                </p>
                <p>
                  <strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or
                  to protect our rights and safety.
                </p>
                <p>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale, your information
                  may be transferred to the new entity.
                </p>
                <p>
                  <strong>No Sale of Data:</strong> We do not sell, rent, or trade your personal information to third
                  parties for marketing purposes.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Encryption:</strong> All data is encrypted in transit using TLS and at rest using
                  industry-standard encryption.
                </p>
                <p>
                  <strong>Access Controls:</strong> We implement strict access controls and authentication mechanisms to
                  protect your data.
                </p>
                <p>
                  <strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments.
                </p>
                <p>
                  <strong>Incident Response:</strong> We have procedures in place to detect, respond to, and notify you
                  of any security incidents.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Access:</strong> You can request access to your personal data at any time.
                </p>
                <p>
                  <strong>Correction:</strong> You can update or correct your personal information through your account
                  settings.
                </p>
                <p>
                  <strong>Deletion:</strong> You can request deletion of your account and associated data.
                </p>
                <p>
                  <strong>Portability:</strong> You can request a copy of your data in a machine-readable format.
                </p>
                <p>
                  <strong>Objection:</strong> You can object to certain processing of your personal data.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We retain your personal data only as long as necessary to provide our services and comply with legal
                  obligations:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account data: Retained while your account is active and for 30 days after deletion</li>
                  <li>Usage logs: Retained for 12 months for security and analytics purposes</li>
                  <li>Support communications: Retained for 24 months</li>
                  <li>Legal compliance data: Retained as required by applicable laws</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. International Transfers</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Your data may be processed and stored in countries other than your own. We ensure appropriate
                  safeguards are in place for international data transfers, including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Adequacy decisions for countries with equivalent data protection laws</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <div className="space-y-3 text-gray-700">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns</li>
                  <li>Improve security</li>
                </ul>
                <p>You can control cookie settings through your browser preferences.</p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Our service is not intended for children under 16 years of age. We do not knowingly collect personal
                  information from children under 16. If we become aware that we have collected personal information
                  from a child under 16, we will take steps to delete such information.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending you an email notification</li>
                  <li>Displaying a notice in your account dashboard</li>
                </ul>
                <p>Your continued use of our service after any changes constitutes acceptance of the updated policy.</p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <div className="space-y-3 text-gray-700">
                <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong> privacy@signify.com
                  </p>
                  <p>
                    <strong>Address:</strong> [Your Company Address]
                  </p>
                  <p>
                    <strong>Data Protection Officer:</strong> dpo@signify.com
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
