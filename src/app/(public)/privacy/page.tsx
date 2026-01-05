'use client'

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: December 26, 2025</p>

      <div className="prose prose-garden max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              <strong>1.1 Account Information:</strong> When you create an account, we collect your 
              email address and optional display name.
            </p>
            <p>
              <strong>1.2 Garden Data:</strong> Information you provide about your seeds, plantings, 
              garden locations, and related gardening activities.
            </p>
            <p>
              <strong>1.3 Usage Data:</strong> We may collect information about how you use the Service, 
              including pages visited and features used.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>To provide and maintain the Service</li>
            <li>To send service-related communications</li>
            <li>To improve the Service and develop new features</li>
            <li>To respond to your inquiries and provide support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Security</h2>
          <p className="text-gray-700">
            We implement reasonable security measures to protect your personal information. However, 
            no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
          <p className="text-gray-700">
            We retain your data as described in our Terms of Service. You can 
            request deletion of your account and data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
          <div className="text-gray-700 space-y-3">
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Resend:</strong> Email delivery for magic links and notifications</li>
            </ul>
            <p>
              These services have their own privacy policies governing their use of your information.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access your personal data</li>
            <li>Export your data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Us</h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy or wish to exercise your rights regarding 
            your personal data, please contact us through the Service.
          </p>
        </section>
      </div>
    </div>
  )
}
