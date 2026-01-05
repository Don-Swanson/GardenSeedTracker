import Link from 'next/link'
import { Heart, Coffee, Github, Sprout, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'Support the Project | Garden Seed Tracker',
  description: 'Help support the development of Garden Seed Tracker - a free, open-source tool for gardeners.',
}

const donationOptions = [
  {
    name: 'Ko-Fi',
    description: 'Buy me a coffee! One-time or monthly support.',
    url: 'https://ko-fi.com/donswanson',
    icon: Coffee,
    color: 'bg-[#FF5E5B] hover:bg-[#e54e4b]',
    textColor: 'text-white',
  },
  {
    name: 'GitHub Sponsors',
    description: 'Support through GitHub with monthly tiers.',
    url: 'https://github.com/sponsors/Don-Swanson',
    icon: Github,
    color: 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600',
    textColor: 'text-white',
  },
]

export default function DonatePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-6">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Support Garden Seed Tracker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Garden Seed Tracker is free and open-source. Your support helps keep it running and enables continued development of new features.
        </p>
      </div>

      {/* Why Support */}
      <div className="bg-garden-50 dark:bg-garden-900/30 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sprout className="w-6 h-6 text-garden-600" />
          Why Your Support Matters
        </h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-3">
            <span className="text-garden-600 mt-1">•</span>
            <span><strong>Server costs:</strong> Hosting, databases, and infrastructure to keep the app running smoothly.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-garden-600 mt-1">•</span>
            <span><strong>Development time:</strong> Building new features, fixing bugs, and maintaining the codebase.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-garden-600 mt-1">•</span>
            <span><strong>Plant database:</strong> Expanding and maintaining our comprehensive plant encyclopedia.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-garden-600 mt-1">•</span>
            <span><strong>Keeping it free:</strong> Your support helps ensure all features remain free for everyone.</span>
          </li>
        </ul>
      </div>

      {/* Donation Options */}
      <div className="space-y-4 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Ways to Support
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {donationOptions.map((option) => {
            const Icon = option.icon
            return (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${option.color} ${option.textColor} rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <Icon className="w-8 h-8" />
                  <span className="text-xl font-bold">{option.name}</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
                </div>
                <p className="opacity-90">{option.description}</p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Other Ways to Help */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Other Ways to Help
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Not able to donate? There are other valuable ways you can contribute:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⭐ Star on GitHub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help others discover the project by starring our repository.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🐛 Report Bugs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found an issue? Let us know so we can fix it.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Suggest Features</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have an idea? We&apos;d love to hear your suggestions.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📣 Spread the Word</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tell your gardening friends about Garden Seed Tracker!
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Link */}
      <div className="text-center mt-12">
        <a
          href="https://github.com/Don-Swanson/GardenSeedTracker"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400 transition-colors"
        >
          <Github className="w-5 h-5" />
          View on GitHub
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Thank You */}
      <div className="text-center mt-12 p-8 bg-gradient-to-br from-pink-50 to-garden-50 dark:from-pink-900/20 dark:to-garden-900/20 rounded-2xl">
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Thank You! 🌻
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Every contribution, big or small, helps keep this project growing.
        </p>
      </div>
    </div>
  )
}
