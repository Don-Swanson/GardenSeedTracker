# 🌱 Garden Seed Tracker

A comprehensive web application to help gardeners track their seeds, plan plantings, and grow successful gardens. Features passwordless authentication, subscription-based premium features, dark mode support, and automatic recurring billing.

## ✨ Features

### 🆓 Free Features
- **📦 Basic Seed Inventory** - Track seeds with name, quantity, brand, and variety
- **⭐ Seed Wishlist** - Keep track of seeds you want to buy with priority levels and purchase links
- **🌿 Plant Encyclopedia** - Browse 50+ plants with detailed information, growing guides, recipes, and medicinal uses
- **💡 Community Contributions** - Submit suggestions to improve plant information
- **⚙️ Settings** - Configure your USDA hardiness zone and preferences
- **🌙 Dark Mode** - Full dark mode support throughout the app

### 💎 Pro Features ($4.99/year or $59 Lifetime)
- **📅 Seed Dates** - Track sow dates, purchase dates, and expiration dates
- **🌱 Growing Info** - Days to germination, days to maturity, planting depth, and spacing
- **📝 Seed Notes** - Add detailed notes for each seed variety
- **🏪 Seed Source** - Track where you purchased your seeds
- **📍 Planting History** - Link seeds to plantings and track growth events
- **📅 Planting Calendar** - View optimal planting times based on your hardiness zone with frost date calculations
- **📖 Farmers Almanac** - Moon phases, companion planting guides, pest control tips, and seasonal advice
- **📤 Export Data** - Download your garden data anytime in JSON format
- **🎯 Priority Support** - Get help when you need it

> **Free users see a blurred preview** of premium fields, so they know exactly what features they're missing!

### 📚 Plant Encyclopedia
Each plant page includes:
- **General Information** - Description, scientific name, and growing overview
- **Hardiness Zones** - Compatible and optimal growing zones
- **Fun Facts** - Interesting trivia and history
- **Varieties** - Popular cultivars and their characteristics
- **Culinary Uses** - Cooking tips, flavor profiles, and recipes
- **Craft & DIY Ideas** - Creative projects using plants (soaps, dyes, wreaths, pressed art)
- **Medicinal & Holistic Uses** - Traditional and modern applications
- **Growing Guide** - Planting times, spacing, and care instructions
- **Companion Planting** - What to plant together and what to avoid
- **Pest & Disease Management** - Common problems and organic solutions
- **Community Suggestions** - Logged-in users can submit updates and improvements

### 💰 Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic seed tracking, wishlist, plant encyclopedia |
| **Pro** | $4.99/year | All premium features with annual billing |
| **Lifetime** | $59 one-time | Permanent access to all features forever |

### 🔐 Authentication
- **Passwordless Magic Links** - Secure, no-password sign-in via email
- **Optional Google OAuth** - Quick sign-in with Google account
- **Flexible Sessions** - "Remember me" option for extended sessions (30 days vs 24 hours)
- **Database Sessions** - Secure server-side session management

### 🔄 Subscription Management
- **Free 7-Day Trial** - Try all features risk-free
- **Automatic Renewal** - Subscriptions renew automatically via Square
- **Secure Card Storage** - Square handles all payment card storage (PCI compliant)
- **Easy Cancellation** - Cancel anytime from Settings page
- **Renewal Reminders** - Email notifications before subscription expires

### 📊 Data & Privacy
- **User Data Ownership** - Export all your data anytime
- **Data Retention** - Clear data retention policy in Terms of Service
- **GDPR-Ready** - Admin tools for complete user data removal
- **No Credit Card Storage** - We never store payment card numbers

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 with App Router |
| **Database** | SQLite with Prisma ORM |
| **Authentication** | NextAuth.js (Email Provider + Google OAuth) |
| **Payments** | Square (Checkout API + Subscriptions) |
| **Styling** | Tailwind CSS with dark mode support |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |
| **Language** | TypeScript |
| **Deployment** | Docker / Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Square Developer account (for payment processing)
- SMTP server access (for magic link emails)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials (see Environment Variables section below).

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Docker Deployment

The app includes Docker support for easy deployment:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

The Docker setup includes:
- Persistent SQLite database volume
- Automatic container restart
- Environment variable configuration
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path (e.g., `file:./dev.db`) |
| `NEXTAUTH_URL` | Yes | Your app URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption |
| `EMAIL_SERVER_HOST` | Yes | SMTP server hostname |
| `EMAIL_SERVER_PORT` | Yes | SMTP port (usually 587) |
| `EMAIL_SERVER_USER` | Yes | SMTP username |
| `EMAIL_SERVER_PASSWORD` | Yes | SMTP password |
| `EMAIL_FROM` | Yes | From address for emails |
| `SQUARE_ACCESS_TOKEN` | Yes | Square API access token |
| `SQUARE_APP_ID` | Yes | Square application ID |
| `SQUARE_LOCATION_ID` | Yes | Square location ID |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Yes | Square webhook signature key |
| `SQUARE_ENVIRONMENT` | Yes | `sandbox` or `production` |
| `CRON_SECRET` | Yes | Secret for cron job authentication |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `ADMIN_API_KEY` | No | API key for admin endpoints |

### Setting Up Square

1. Create a [Square Developer account](https://developer.squareup.com)
2. Create an application in the Square Developer Dashboard
3. Get your Access Token, Application ID, and Location ID
4. Set up webhook endpoint pointing to `/api/square/webhook`
5. Subscribe to these webhook events:
   - `payment.completed`
   - `order.fulfilled`
   - `subscription.created`
   - `subscription.updated`
6. Add all credentials to your `.env` file
7. For testing, use the Sandbox environment

### Setting Up Email (Magic Links)

For magic link authentication, you need an SMTP server. Options include:
- **SendGrid** - Free tier available
- **Mailgun** - Free tier available
- **Amazon SES** - Very affordable
- **Gmail SMTP** - For development/small scale

### Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables
4. The `vercel.json` configures automatic cron jobs for:
   - Daily subscription processing (trial conversions, auto-renewals)
   - Renewal reminder emails

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema with User, Seed, Planting, Plant models
│   └── seed.ts             # Seed data for 50+ planting guides with rich content
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/      # Admin endpoints (lifetime grants, data removal)
│   │   │   ├── auth/       # Auth endpoints (register, magic links, password reset)
│   │   │   ├── cron/       # Cron jobs (subscription processing, reminders)
│   │   │   ├── plantings/  # Planting CRUD + events (Pro)
│   │   │   ├── plants/     # Plant encyclopedia API + suggestions
│   │   │   ├── seeds/      # Seed inventory CRUD (with Pro fields)
│   │   │   ├── settings/   # User settings
│   │   │   ├── square/     # Payment checkout & webhooks
│   │   │   ├── subscription/ # Subscription status & cancellation
│   │   │   └── wishlist/   # Wishlist CRUD
│   │   ├── auth/           # Auth pages (signin, signup, forgot password)
│   │   ├── seeds/          # Seed inventory pages with Pro feature gating
│   │   ├── plantings/      # Planting log pages with event tracking (Pro)
│   │   ├── plants/         # Plant encyclopedia with detail pages
│   │   ├── calendar/       # Planting calendar with zone-based dates (Pro)
│   │   ├── wishlist/       # Seed wishlist pages
│   │   ├── almanac/        # Farmers almanac with moon phases (Pro)
│   │   ├── settings/       # User settings & subscription management
│   │   ├── upgrade/        # Subscription upgrade page
│   │   ├── pricing/        # Public pricing page
│   │   ├── privacy/        # Privacy policy page
│   │   └── terms/          # Terms of service page
│   ├── components/
│   │   ├── AuthProvider.tsx    # NextAuth session provider
│   │   ├── Navigation.tsx      # Main navigation with auth state
│   │   ├── SeedCard.tsx        # Seed display with Pro feature indicators
│   │   ├── SeedFilters.tsx     # Search and filter controls
│   │   ├── LockedContent.tsx   # Blurred preview for Pro features
│   │   ├── DeleteSeedButton.tsx # Confirmation delete button
│   │   └── WishlistActions.tsx  # Wishlist item actions
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration with magic links
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── square.ts        # Square client & subscription tiers
│   │   ├── subscription.ts  # Feature access control & Pro gating
│   │   ├── garden-utils.ts  # Planting date calculations
│   │   ├── audit.ts         # Audit logging
│   │   ├── csrf.ts          # CSRF protection
│   │   └── validation.ts    # Input validation
│   └── types/
│       └── next-auth.d.ts   # NextAuth type extensions
├── docker-compose.yml       # Production Docker config
├── docker-compose.dev.yml   # Development Docker config
├── Dockerfile               # Production container
├── Dockerfile.dev           # Development container
├── vercel.json              # Vercel config with cron jobs
└── tailwind.config.js       # Tailwind with dark mode
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma generate` | Generate Prisma client |
| `npm run db:seed` | Seed database with planting guide data |
| `npx prisma studio` | Open Prisma Studio GUI |

## 🔌 API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js handlers (magic links, OAuth) |
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/extend-session` | Extend session for "remember me" |

### Seeds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seeds` | List all user's seeds |
| POST | `/api/seeds` | Create a new seed |
| GET | `/api/seeds/[id]` | Get seed details |
| PUT | `/api/seeds/[id]` | Update a seed |
| DELETE | `/api/seeds/[id]` | Delete a seed |

### Plantings (Pro)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plantings` | List all plantings |
| POST | `/api/plantings` | Create a planting |
| GET | `/api/plantings/[id]` | Get planting details |
| PUT | `/api/plantings/[id]` | Update a planting |
| DELETE | `/api/plantings/[id]` | Delete a planting |
| POST | `/api/plantings/[id]/events` | Add growth event |
| DELETE | `/api/plantings/[id]/events/[eventId]` | Delete event |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist` | List wishlist items |
| POST | `/api/wishlist` | Add to wishlist |
| PUT | `/api/wishlist/[id]` | Update wishlist item |
| DELETE | `/api/wishlist/[id]` | Remove from wishlist |

### Plants (Encyclopedia)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plants` | List all plants with basic info |
| GET | `/api/plants/[id]` | Get full plant details |
| POST | `/api/plants/[id]/suggestions` | Submit improvement suggestion |
| GET | `/api/plants/[id]/suggestions` | List suggestions (admin only) |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get subscription status |
| POST | `/api/subscription/cancel` | Cancel subscription |
| POST | `/api/square/checkout` | Create checkout (tier or trial) |
| POST | `/api/square/webhook` | Handle Square events |

### Admin (Requires API Key)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/grant-lifetime` | Grant lifetime membership |
| POST | `/api/admin/remove-user-data` | Remove all user data (GDPR) |

### Cron Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron/process-subscriptions` | Process trials & renewals |
| GET | `/api/cron/renewal-reminders` | Send expiry reminder emails |

## 🎨 Customization

### Color Theme
The app uses a custom garden-inspired color palette defined in `tailwind.config.js`:
- **Garden** - Green shades for primary UI elements
- **Soil** - Brown shades for secondary/accent elements

### Adding New Plants
Edit `prisma/seed.ts` to add new plants to the database. Each plant includes:
- Name, category, description
- Days to germination and maturity
- Planting depth, spacing, sun/water requirements
- Companion plants and planting tips

## 🔒 Security Features

- **Passwordless Auth** - No passwords to steal or leak
- **CSRF Protection** - Built into NextAuth.js
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - React's built-in escaping
- **Secure Sessions** - Database-backed with httpOnly cookies
- **API Authentication** - All routes verify user session
- **User Data Scoping** - Users can only access their own data
- **PCI Compliance** - Square handles all payment card data

## 📄 Legal Pages

- `/privacy` - Privacy Policy
- `/terms` - Terms of Service with data retention policy

## 🙏 Acknowledgments

- Plant data compiled from various agricultural extension services
- Moon phase calculations for almanac features
- USDA Hardiness Zone data for planting calendars

---

**Happy Gardening! 🌻🥕🍅**
