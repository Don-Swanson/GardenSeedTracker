import Link from 'next/link'
import { 
  Sprout, 
  Package, 
  CalendarDays, 
  MapPin, 
  Star, 
  BookOpen,
  Check,
  Leaf,
  Sun,
  Droplets,
  TrendingUp,
  Heart,
  Github
} from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Seed Inventory',
    description: 'Track all your seeds in one place. Know what you have, when it expires, and where you got it.',
  },
  {
    icon: MapPin,
    title: 'Planting Log',
    description: 'Record every planting with dates, locations, and notes. Track your garden\'s progress over time.',
  },
  {
    icon: CalendarDays,
    title: 'Planting Calendar',
    description: 'Get personalized planting schedules based on your hardiness zone and local frost dates.',
  },
  {
    icon: Star,
    title: 'Wishlist',
    description: 'Keep track of seeds and plants you want to try. Never forget that variety you saw at the nursery.',
  },
  {
    icon: BookOpen,
    title: 'Almanac',
    description: 'Access moon phases, seasonal tips, and gardening wisdom to plan your activities.',
  },
  {
    icon: Leaf,
    title: 'Plant Encyclopedia',
    description: 'Browse our comprehensive database of plants with growing guides, recipes, and companion planting tips.',
  },
]

const testimonials = [
  {
    quote: "Finally, a simple way to track all my seeds! I used to forget what I had and buy duplicates every year.",
    author: "Sarah M.",
    role: "Home Gardener"
  },
  {
    quote: "The planting calendar feature has transformed how I plan my garden. No more guessing when to start seeds!",
    author: "Michael R.",
    role: "Urban Farmer"
  },
  {
    quote: "I love being able to look back at my planting history. It helps me learn what works in my garden.",
    author: "Jennifer L.",
    role: "Master Gardener"
  },
]

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-garden-100 dark:bg-garden-900 rounded-full text-garden-700 dark:text-garden-300 text-sm font-medium mb-6">
            <Sprout className="w-4 h-4" />
            Your Digital Garden Companion
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Grow Smarter with{' '}
            <span className="text-garden-600 dark:text-garden-400">Garden Seed Tracker</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track your seeds, plan your plantings, and harvest more success. The all-in-one tool for gardeners who want to grow their best garden yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-garden-600 text-white text-lg font-semibold rounded-xl hover:bg-garden-700 transition-colors shadow-lg shadow-garden-600/25"
            >
              Start Growing Free
            </Link>
            <a
              href="https://github.com/Don-Swanson/GardenSeedTracker"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Free and open source • Self-host or use our hosted version
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-garden-100 dark:bg-garden-900 rounded-xl mx-auto mb-3">
              <Package className="w-6 h-6 text-garden-600 dark:text-garden-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">500+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Seed Varieties</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl mx-auto mb-3">
              <Leaf className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">100+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plant Guides</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl mx-auto mb-3">
              <Sun className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">13</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Hardiness Zones</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-xl mx-auto mb-3">
              <Droplets className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">365</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Days of Tips</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Grow
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From seed to harvest, we've got the tools to help you succeed in the garden.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-garden-100 dark:bg-garden-900 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-garden-600 dark:text-garden-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-garden-50 to-garden-100 dark:from-garden-900/50 dark:to-garden-800/50 rounded-2xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple as 1, 2, 3
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get started in minutes, not hours.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl font-bold text-garden-600 dark:text-garden-400 mx-auto mb-4 shadow-lg">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign Up Free
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create your account in seconds with just your email. No credit card required.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl font-bold text-garden-600 dark:text-garden-400 mx-auto mb-4 shadow-lg">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Add Your Seeds
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Inventory your seed collection with details like variety, brand, and expiration.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl font-bold text-garden-600 dark:text-garden-400 mx-auto mb-4 shadow-lg">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Plan & Grow
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Use our tools to plan plantings, track progress, and grow your best garden.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Gardeners
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            See what our community has to say.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-garden-600 dark:bg-garden-700 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Grow Your Best Garden?
        </h2>
        <p className="text-xl text-garden-100 mb-8 max-w-2xl mx-auto">
          Join thousands of gardeners who are tracking smarter and harvesting more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-white text-garden-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/donate"
            className="px-8 py-4 bg-garden-700 dark:bg-garden-800 text-white text-lg font-semibold rounded-xl hover:bg-garden-800 dark:hover:bg-garden-900 transition-colors border border-garden-500 flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Support the Project
          </Link>
        </div>
      </section>
    </div>
  )
}
