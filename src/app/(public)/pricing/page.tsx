import Link from 'next/link'
import { Check, X, Crown, Sprout } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with seed tracking.',
    features: [
      { text: 'Unlimited seed inventory', included: true },
      { text: 'Basic seed info (name, variety, quantity)', included: true },
      { text: 'Wishlist management', included: true },
      { text: 'Plant encyclopedia access', included: true },
      { text: 'Purchase & expiration dates', included: false },
      { text: 'Growing info (sun, water, spacing)', included: false },
      { text: 'Notes & source tracking', included: false },
      { text: 'Planting history', included: false },
      { text: 'Planting log & calendar', included: false },
    ],
    cta: 'Get Started Free',
    ctaHref: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: 'per year',
    description: 'Everything you need for serious gardening.',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Purchase & expiration tracking', included: true },
      { text: 'Full growing information', included: true },
      { text: 'Notes & source tracking', included: true },
      { text: 'Complete planting history', included: true },
      { text: 'Planting log with events', included: true },
      { text: 'Personalized planting calendar', included: true },
      { text: 'Planting Reminders (Coming Soon)', included: true },
      { text: 'Almanac & moon phases', included: true },
      { text: 'Zone-based recommendations', included: true },
      { text: 'Export all your data', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaHref: '/upgrade',
    highlighted: true,
  },
  {
    name: 'Lifetime',
    price: '$59',
    period: 'one-time',
    description: 'Best value for dedicated gardeners.',
    features: [
      { text: 'All Pro features', included: true },
      { text: 'Lifetime access', included: true },
      { text: 'All future updates', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Support independent development', included: true },
      { text: 'No recurring payments', included: true },
      { text: 'Lock in current price', included: true },
      { text: 'Family sharing (coming soon)', included: true },
    ],
    cta: 'Get Lifetime Access',
    ctaHref: '/upgrade?plan=lifetime',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'Can I use Garden Seed Tracker for free?',
    answer: 'Yes! Our free plan includes unlimited seed inventory tracking (name, variety, quantity, brand), wishlist management, and access to our plant encyclopedia. You can use these features forever without paying anything.',
  },
  {
    question: 'What\'s hidden in the free version?',
    answer: 'Free users can enter all seed information, but viewing purchase dates, expiration dates, growing info (sun, water, spacing), notes, source details, and planting history requires Pro. You\'ll see these sections with a lock icon showing what you\'re missing.',
  },
  {
    question: 'What do I get with Pro?',
    answer: 'Pro unlocks all the detailed seed information you\'ve entered, plus powerful features like the planting log to track your garden history, a personalized planting calendar based on your zone, the almanac with moon phases, and the ability to export all your data.',
  },
  {
    question: 'Is the Lifetime plan really lifetime?',
    answer: 'Yes! Pay once and get Pro features forever, including all future updates. No subscriptions, no recurring charges. It\'s the best value if you plan to garden for years to come.',
  },
  {
    question: 'Can I upgrade from Free to Pro later?',
    answer: 'Absolutely! You can upgrade at any time. All your existing seed inventory data (including the premium fields you entered) will immediately become visible, and you\'ll get access to all Pro features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards through our secure payment processor. Your payment information is never stored on our servers.',
  },
  {
    question: 'Can I cancel my Pro subscription?',
    answer: 'Yes, you can cancel anytime. You\'ll continue to have Pro access until the end of your billing period, then your account will revert to the free plan. Your data is never deleted - it\'s just hidden behind the paywall again.',
  },
]

export default function PricingPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Header */}
      <section className="text-center pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-garden-100 dark:bg-garden-900 rounded-full text-garden-700 dark:text-garden-300 text-sm font-medium mb-6">
          <Crown className="w-4 h-4" />
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Start free, upgrade when you're ready. No hidden fees, no surprises.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 ${
              plan.highlighted
                ? 'bg-garden-600 dark:bg-garden-700 text-white shadow-xl shadow-garden-600/25 scale-105'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className={`text-xl font-semibold mb-2 ${
                plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-bold ${
                  plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {plan.price}
                </span>
                <span className={plan.highlighted ? 'text-garden-200' : 'text-gray-500 dark:text-gray-400'}>
                  /{plan.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${
                plan.highlighted ? 'text-garden-200' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {plan.description}
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className={`w-5 h-5 flex-shrink-0 ${
                      plan.highlighted ? 'text-garden-300' : 'text-garden-600 dark:text-garden-400'
                    }`} />
                  ) : (
                    <X className={`w-5 h-5 flex-shrink-0 ${
                      plan.highlighted ? 'text-garden-400' : 'text-gray-300 dark:text-gray-600'
                    }`} />
                  )}
                  <span className={`text-sm ${
                    feature.included
                      ? plan.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      : plan.highlighted ? 'text-garden-300' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.ctaHref}
              className={`block w-full py-3 px-4 text-center font-semibold rounded-xl transition-colors ${
                plan.highlighted
                  ? 'bg-white text-garden-600 hover:bg-gray-100'
                  : 'bg-garden-600 text-white hover:bg-garden-700'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      {/* Feature Comparison */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Feature Comparison
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Feature</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">Free</th>
                <th className="text-center py-4 px-4 font-semibold text-garden-600 dark:text-garden-400">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Seed Inventory</td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Wishlist</td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Plant Encyclopedia</td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Purchase & Expiration Dates</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Growing Info (Sun, Water, etc.)</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Notes & Source Tracking</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Planting History</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Planting Log</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Planting Calendar</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Almanac & Moon Phases</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Zone Recommendations</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Data Export</td>
                <td className="py-4 px-4 text-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /></td>
                <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-garden-600 dark:text-garden-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-br from-garden-50 to-garden-100 dark:from-garden-900/50 dark:to-garden-800/50 rounded-2xl p-8 md:p-12">
        <Sprout className="w-12 h-12 text-garden-600 dark:text-garden-400 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Start Growing?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
          Join our community of gardeners and start tracking your seeds today.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-4 bg-garden-600 text-white text-lg font-semibold rounded-xl hover:bg-garden-700 transition-colors"
        >
          Get Started Free
        </Link>
      </section>
    </div>
  )
}
