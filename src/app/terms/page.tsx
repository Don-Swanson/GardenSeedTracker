'use client'

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: December 26, 2025</p>

      <div className="prose prose-garden max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing or using Garden Seed Tracker ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
          <p className="text-gray-700">
            Garden Seed Tracker is a web application that helps gardeners track their seed inventory, 
            plan plantings, and manage their garden activities. The Service offers both free and 
            paid subscription tiers with different feature sets.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
          <p className="text-gray-700">
            You are responsible for maintaining the confidentiality of your account and for all 
            activities that occur under your account. You agree to notify us immediately of any 
            unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Subscription and Payment</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              <strong>4.1 Free Tier:</strong> Basic features are available at no cost with limited functionality.
            </p>
            <p>
              <strong>4.2 Paid Subscription:</strong> Pro features require an annual subscription of $5 or more 
              (pay-what-you-want model). Payments are processed securely through Square.
            </p>
            <p>
              <strong>4.3 Auto-Renewal:</strong> If you enable auto-renewal, your subscription will automatically 
              renew at the end of each subscription period. You will receive a reminder email approximately 
              7 days before renewal. You can disable auto-renewal at any time from your Settings page.
            </p>
            <p>
              <strong>4.4 Cancellation:</strong> You may cancel your subscription at any time. Upon cancellation, 
              you will retain access to paid features until the end of your current billing period.
            </p>
            <p>
              <strong>4.5 Refunds:</strong> All payments are final. Refunds may be issued at our sole discretion 
              on a case-by-case basis.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Data and Content</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              <strong>5.1 Ownership:</strong> You retain ownership of all data and content you submit to the 
              Service, including seed inventory, planting records, and images.
            </p>
            <p>
              <strong>5.2 License:</strong> By submitting content to the Service, you grant us a non-exclusive, 
              worldwide license to use, store, and display your content solely for the purpose of providing 
              the Service to you.
            </p>
            <p>
              <strong>5.3 Data Retention:</strong> We reserve the right to remove or delete user data at any 
              time for any reason, including but not limited to: violation of these terms, account inactivity, 
              or service discontinuation. However, our typical practice is as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Active subscriptions:</strong> Data is retained for the duration of your subscription.
              </li>
              <li>
                <strong>Expired subscriptions:</strong> We will typically retain your Pro feature data 
                (plantings, images, garden locations, etc.) for up to one (1) year after subscription 
                expiration to allow you time to renew and regain access. After this period, Pro feature 
                data may be permanently deleted.
              </li>
              <li>
                <strong>Free tier data:</strong> Basic seed inventory and wishlist data is retained as long 
                as your account remains active.
              </li>
              <li>
                <strong>Account deletion:</strong> If you request account deletion, all your data will be 
                permanently removed within 30 days.
              </li>
            </ul>
            <p>
              <strong>5.4 No Guarantee:</strong> While we make reasonable efforts to protect your data, we 
              do not guarantee the preservation, backup, or availability of any user data. You are responsible 
              for maintaining your own backups of important information.
            </p>
            <p>
              <strong>5.5 Data Export:</strong> Paid subscribers have access to data export features. We 
              recommend regularly exporting your data for your own records.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Expired Subscription Access</h2>
          <div className="text-gray-700 space-y-3">
            <p>
              When your paid subscription expires:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You will retain access to free tier features (seed inventory, wishlist).</li>
              <li>Pro features (planting calendar, almanac, image uploads, etc.) will become inaccessible.</li>
              <li>Your Pro data will be preserved but hidden behind a paywall.</li>
              <li>You can regain access to your Pro data at any time by renewing your subscription.</li>
              <li>After approximately one year of expired status, Pro data may be removed (see Section 5.3).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Acceptable Use</h2>
          <p className="text-gray-700">
            You agree not to use the Service for any unlawful purpose or in any way that could damage, 
            disable, or impair the Service. You may not attempt to gain unauthorized access to any part 
            of the Service or any systems connected to it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
            OR COMPLETELY SECURE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-700">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, 
            PROFITS, OR BUSINESS OPPORTUNITIES.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these Terms of Service at any time. We will notify users of 
            significant changes via email or through the Service. Your continued use of the Service 
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us through the 
            Service or via the contact information provided on our website.
          </p>
        </section>
      </div>

      <div className="mt-12 p-4 bg-garden-50 rounded-lg">
        <p className="text-sm text-garden-700 text-center">
          By using Garden Seed Tracker, you acknowledge that you have read, understood, and agree 
          to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  )
}
