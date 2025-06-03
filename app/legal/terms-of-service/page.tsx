import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  By accessing and using Signify ("the Service"), you accept and agree to be bound by the terms and
                  provision of this agreement. If you do not agree to abide by the above, please do not use this
                  service.
                </p>
                <p>
                  These Terms of Service ("Terms") govern your use of our email signature management platform operated
                  by [Your Company Name] ("us", "we", or "our").
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <div className="space-y-3 text-gray-700">
                <p>Signify is a cloud-based email signature management platform that allows organizations to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create and manage email signature templates</li>
                  <li>Deploy signatures to users via Exchange Online</li>
                  <li>Integrate with Azure Active Directory for user management</li>
                  <li>Monitor and audit signature deployments</li>
                  <li>Manage organizational branding and compliance</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts and Registration</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Account Creation:</strong> To use our Service, you must create an account by providing
                  accurate, current, and complete information.
                </p>
                <p>
                  <strong>Account Security:</strong> You are responsible for safeguarding your account credentials and
                  for all activities that occur under your account.
                </p>
                <p>
                  <strong>Organization Accounts:</strong> Organization administrators are responsible for managing user
                  access and ensuring compliance with these Terms.
                </p>
                <p>
                  <strong>Account Termination:</strong> We reserve the right to terminate accounts that violate these
                  Terms or engage in prohibited activities.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Transmit malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for spam or unsolicited communications</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Engage in any activity that could harm our reputation</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data and Privacy</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Data Ownership:</strong> You retain ownership of all data you upload to or create within the
                  Service.
                </p>
                <p>
                  <strong>Data Processing:</strong> We process your data in accordance with our Privacy Policy and
                  applicable data protection laws.
                </p>
                <p>
                  <strong>Data Security:</strong> We implement appropriate technical and organizational measures to
                  protect your data.
                </p>
                <p>
                  <strong>Data Backup:</strong> While we maintain backups, you are responsible for maintaining your own
                  copies of important data.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Subscription and Payment</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Subscription Plans:</strong> Our Service is offered through various subscription plans with
                  different features and limitations.
                </p>
                <p>
                  <strong>Payment Terms:</strong> Subscription fees are billed in advance on a monthly or annual basis,
                  depending on your chosen plan.
                </p>
                <p>
                  <strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal
                  date.
                </p>
                <p>
                  <strong>Refunds:</strong> Refunds are provided in accordance with our refund policy, typically within
                  30 days of initial purchase.
                </p>
                <p>
                  <strong>Price Changes:</strong> We may change subscription prices with 30 days' notice to existing
                  customers.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Our IP:</strong> The Service, including its software, design, and content, is protected by
                  intellectual property laws and remains our property.
                </p>
                <p>
                  <strong>Your IP:</strong> You retain all rights to your content, including signature templates, logos,
                  and organizational data.
                </p>
                <p>
                  <strong>License Grant:</strong> You grant us a limited license to use your content solely to provide
                  the Service.
                </p>
                <p>
                  <strong>Trademark:</strong> "Signify" and our logos are trademarks and may not be used without
                  permission.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Service Availability and Support</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Uptime:</strong> We strive to maintain 99.9% uptime but do not guarantee uninterrupted service
                  availability.
                </p>
                <p>
                  <strong>Maintenance:</strong> We may perform scheduled maintenance with advance notice when possible.
                </p>
                <p>
                  <strong>Support:</strong> Support is provided according to your subscription plan and our support
                  policy.
                </p>
                <p>
                  <strong>Service Changes:</strong> We may modify, suspend, or discontinue features with reasonable
                  notice.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Service Basis:</strong> The Service is provided "as is" and "as available" without warranties
                  of any kind.
                </p>
                <p>
                  <strong>Liability Limits:</strong> Our total liability to you for any claims related to the Service
                  shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
                <p>
                  <strong>Excluded Damages:</strong> We shall not be liable for indirect, incidental, special,
                  consequential, or punitive damages.
                </p>
                <p>
                  <strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond
                  our reasonable control.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
              <div className="space-y-3 text-gray-700">
                <p>You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any rights of another party</li>
                  <li>Content you upload or create using the Service</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>By You:</strong> You may terminate your account at any time through your account settings or
                  by contacting support.
                </p>
                <p>
                  <strong>By Us:</strong> We may terminate your account for violation of these Terms, non-payment, or
                  other legitimate reasons.
                </p>
                <p>
                  <strong>Effect of Termination:</strong> Upon termination, your access to the Service will cease, and
                  your data may be deleted after a reasonable grace period.
                </p>
                <p>
                  <strong>Data Export:</strong> You may export your data before termination, subject to technical
                  limitations.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Governing Law and Disputes</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Governing Law:</strong> These Terms are governed by the laws of [Your Jurisdiction] without
                  regard to conflict of law principles.
                </p>
                <p>
                  <strong>Dispute Resolution:</strong> Any disputes will be resolved through binding arbitration in
                  accordance with the rules of [Arbitration Organization].
                </p>
                <p>
                  <strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive the right
                  to participate in class actions.
                </p>
                <p>
                  <strong>Jurisdiction:</strong> Any legal proceedings must be brought in the courts of [Your
                  Jurisdiction].
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Posting updated Terms on our website</li>
                  <li>Sending email notifications to registered users</li>
                  <li>Displaying notices within the Service</li>
                </ul>
                <p>Your continued use of the Service after changes constitutes acceptance of the new Terms.</p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
              <div className="space-y-3 text-gray-700">
                <p>For questions about these Terms of Service, please contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong> legal@signify.com
                  </p>
                  <p>
                    <strong>Address:</strong> [Your Company Address]
                  </p>
                  <p>
                    <strong>Phone:</strong> [Your Phone Number]
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-x-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
          <Link href="/legal/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
