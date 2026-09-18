

# 🌱 Garden Seed Tracker

![Version](https://img.shields.io/badge/version-0.1.0-green)

> **Current Version:** See the [VERSION](VERSION) file for the latest release number used in Docker and deployments.

Garden Seed Tracker is a free, open source web app to help gardeners track seeds, plan plantings, and grow successful gardens. All features are available to all logged-in users—no payment or subscription required. Donations are welcome to support ongoing development!

## ✨ Features

- **📦 Seed Inventory** – Track seeds with name, quantity, brand, and variety
- **⭐ Seed Wishlist** – Keep track of seeds you want to buy
- **🌿 Plant Encyclopedia** – 50+ plants with growing guides, recipes, and more (login required)
- **📅 Planting Calendar** – Personalized by your hardiness zone
- **📖 Almanac** – Moon phases, companion planting, pest control, and seasonal advice
- **📝 Notes & History** – Add notes, track plantings, and log events
- **📤 Export Data** – Download your garden data anytime
- **💡 Community Suggestions** – Suggest improvements to plant info
- **⚙️ Settings** – Configure your location and preferences
- **🌙 Dark Mode** – Full dark mode support

## 💸 Support Development

Garden Seed Tracker is free for everyone. If you find it useful, please consider supporting the project:

- [☕ Ko-Fi](https://ko-fi.com/gardenseedtracker)
- [💖 GitHub Sponsors](https://github.com/sponsors/Don-Swanson)
- [GitHub Repo](https://github.com/Don-Swanson/GardenSeedTracker)

## 🔐 Authentication & Admin

- **Passwordless Magic Links** – Secure, no-password sign-in via email
- **Optional Google OAuth** – Quick sign-in with Google account
- **First Registered User is Admin** – The first user to register becomes an admin automatically
- **Admin Portal** – Admins can manage users, plants, and impersonate users for troubleshooting

## 👩‍💻 Self-Hosting

You can self-host Garden Seed Tracker for personal or community use. All features are available to all logged-in users. The Plant Encyclopedia is available to authenticated users only. If you want to use the Plant Encyclopedia API in your own app, [contact us](https://github.com/Don-Swanson/GardenSeedTracker/issues) for access.

### Quick Start

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Don-Swanson/GardenSeedTracker.git
   cd GardenSeedTracker
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up your environment:**
   - Copy `.env.example` to `.env.local` and fill in required variables.
   - For local development, SQLite is used by default.
4. **Run database migrations:**
   ```sh
   export DATABASE_URL="file:$(pwd)/prisma/dev.db"
   npm run db:deploy
   npm run db:seed
   ```
5. **Start the development server:**
   ```sh
   npm run dev
   ```
6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Docker

- Development: `docker-compose -f docker-compose.dev.yml up`
- Production: `docker compose up -d --build`

Keep the same persistent data directory and environment configuration across redeploys. Set `GST_DATA_DIR` to the absolute path of your existing data directory. Startup backs up SQLite, applies versioned migrations, and seeds only an entirely empty database.

See [plant catalog and persistence](docs/plant-catalog.md) for safe bulk imports, first-install catalog seeding, and backup/restore.

### A Note on Development

This project is, candidly, largely vibe-coded. It is developed with a security-first mindset, receives regular security reviews, and is tested as extensively as practical to catch bugs and prevent it from becoming vibe-coded garbage. That is not a guarantee of perfection: review the code and deployment configuration for your own risk requirements, and report security concerns through the [GitHub issue tracker](https://github.com/Don-Swanson/GardenSeedTracker/issues).

### Environment Variables

See `.env.example` for all options. Key variables:
- `DATABASE_URL` – SQLite database path
- `NEXTAUTH_URL` – Your app URL
- `NEXTAUTH_SECRET` – Random secret for session encryption
- `EMAIL_SERVER_*` – SMTP config for magic link emails
- `EMAIL_FROM` – From address for emails
- `IPGEO_API_KEY` – (Optional) For accurate astronomy data (ipgeolocation.io)
- `CRON_SECRET` – (Optional) For securing scheduled jobs
- `ADMIN_API_KEY` – (Optional) For admin API endpoints

## 🛠 Project Structure

- `prisma/` – Database schema and seed data
- `src/app/` – Next.js app routes and API endpoints
- `src/components/` – UI components
- `src/lib/` – Utility libraries (auth, moon, garden-utils, etc.)
- `src/types/` – TypeScript type extensions

## 🛠️ Impersonate Feature

Admins can impersonate users for troubleshooting and replicating user-reported issues. All impersonation sessions are logged for security. Use this feature responsibly and only for support purposes.

## 📄 Legal

- `/privacy` – Privacy Policy
- `/terms` – Terms of Service
- Licensed under the GNU AGPLv3. See LICENSE for details.

---

**Happy Gardening! 🌻🥕🍅**
