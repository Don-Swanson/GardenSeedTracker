# Contributing to Garden Seed Tracker

Thank you for your interest in contributing! We welcome all contributions, including bug reports, feature requests, documentation improvements, and code changes.

## Development Setup

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
   npx prisma migrate dev --name init
   ```
5. **Start the development server:**
   ```sh
   npm run dev
   ```

## Code Standards
- Use Prettier and ESLint for formatting and linting.
- Write clear, descriptive commit messages.
- Use descriptive variable and function names.
- Keep components and functions small and focused.
- Write TypeScript types for all new code.

## Pull Requests
- Fork the repository and create your branch from `main`.
- Ensure your branch is up to date with `main` before submitting a PR.
- Include a clear description of your changes and reference any related issues.
- Run `npm run lint` and `npm run build` before submitting.
- All PRs are subject to code review.

## Issue Reporting
- Use GitHub Issues for bug reports and feature requests.
- Include steps to reproduce, expected behavior, and screenshots if applicable.

## Code of Conduct
Be respectful and inclusive. See [Contributor Covenant](https://www.contributor-covenant.org/) for guidelines.

## Contact
For questions, open an issue or discussion on GitHub.

---

Happy gardening! 🌱
