'use client'

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: January 17, 2025</p>

      <div className="prose prose-garden dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">
            By accessing or using Garden Seed Tracker ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Garden Seed Tracker is a free web application that helps gardeners track their seed inventory, 
            plan plantings, and manage their garden activities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. User Accounts</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You are responsible for maintaining the confidentiality of your account and for all 
            activities that occur under your account. You agree to notify us immediately of any 
            unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Usernames and Public Display</h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              <strong>4.1 Public Visibility:</strong> Usernames are publicly visible and will be displayed 
              alongside any community contributions you make, such as plant information submissions and 
              growing guides.
            </p>
            <p>
              <strong>4.2 Appropriate Usernames:</strong> Usernames must be in good taste and appropriate 
              for all audiences. We reserve the right to change or remove any username that we determine, 
              in our sole discretion, to be:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Offensive, vulgar, obscene, or otherwise objectionable</li>
              <li>Hateful, discriminatory, or harassing</li>
              <li>Misleading, impersonating another person, or suggesting official affiliation</li>
              <li>Containing personal information such as phone numbers or addresses</li>
              <li>Promoting illegal activities or violating any law</li>
              <li>Spam-like, promotional, or commercial in nature</li>
            </ul>
            <p>
              <strong>4.3 Username Changes:</strong> If we determine that your username violates these 
              guidelines, we may remove or change it without prior notice. Repeated violations may result 
              in account suspension or termination.
            </p>
            <p>
              <strong>4.4 No Guarantee of Availability:</strong> We cannot guarantee that your desired 
              username will be available. Usernames are assigned on a first-come, first-served basis.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. User Data and Content</h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-3">
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
              or service discontinuation.
            </p>
            <p>
              <strong>5.4 No Guarantee:</strong> While we make reasonable efforts to protect your data, we 
              do not guarantee the preservation, backup, or availability of any user data. You are responsible 
              for maintaining your own backups of important information.
            </p>
            <p>
              <strong>5.5 Data Export:</strong> You have access to data export features. We 
              recommend regularly exporting your data for your own records.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Acceptable Use</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You agree not to use the Service for any unlawful purpose or in any way that could damage, 
            disable, or impair the Service. You may not attempt to gain unauthorized access to any part 
            of the Service or any systems connected to it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-gray-700 dark:text-gray-300">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
            OR COMPLETELY SECURE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
          <p className="text-gray-700 dark:text-gray-300">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, 
            PROFITS, OR BUSINESS OPPORTUNITIES.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Changes to Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We reserve the right to modify these Terms of Service at any time. We will notify users of 
            significant changes via email or through the Service. Your continued use of the Service 
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Contact Information</h2>
          <p className="text-gray-700 dark:text-gray-300">
            If you have any questions about these Terms of Service, please contact us through the 
            Service or via the contact information provided on our website.
          </p>
        </section>
      </div>

      <div className="mt-12 p-4 bg-garden-50 dark:bg-garden-900/30 rounded-lg">
        <p className="text-sm text-garden-700 dark:text-garden-300 text-center">
          By using Garden Seed Tracker, you acknowledge that you have read, understood, and agree 
          to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  )
}
