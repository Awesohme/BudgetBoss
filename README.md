# 💰 BudgetBoss

> A modern, offline-first budgeting PWA with smart pattern learning and intuitive financial insights

![Version](https://img.shields.io/badge/version-4.2-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)
![Icons](https://img.shields.io/badge/Icons-Lucide-orange.svg)

## ✨ Features

### 🔐 **Dual Authentication System**
- **Email/Password Login** - Traditional authentication with permanent sessions
- **Magic Link Authentication** - Passwordless login option
- **Instant Account Creation** - No email verification barriers
- **Permanent Sessions** - Stay logged in indefinitely (perfect for PWA usage)

### 💰 **Smart Budget Management**
- **Intelligent Dashboard** - Shows actual amount meant to be in bank account
- **Smart Pattern Learning** - Auto-suggests frequently used transactions
- **Quick Repeat Transactions** - One-tap transaction creation from patterns
- **Enhanced Calculations** - Unplanned expenses properly reduce bank balance
- **Category Management** - Flexible borrowing system with insights tracking
- **Nigerian Naira (₦)** - Smart formatting with K/M abbreviations

### 📱 **Progressive Web App**
- Offline-first with IndexedDB storage
- Service worker for caching and offline functionality
- Native-like installation experience
- Works seamlessly when saved to home screen

### 📊 **Analytics & Insights**
- **Real-Time Dashboard** - Amount in bank vs budget remaining insights
- **Most Expensive Categories** - Prioritized spending analysis (replaced frequency-based)
- **Category Borrowing Insights** - Moved to dedicated insights section
- **Enhanced Transaction History** - Unplanned expenses styled as intuitive tags
- **Pattern Recognition** - Smart learning from transaction habits
- **Performance Metrics** - Overspent alerts and savings tracking

### 🎨 **Modern User Experience**
- **Professional Icon System** - Lucide React icons throughout
- **Streamlined Time Picker** - Direct date/time selection (no intermediate steps)
- **Smart Amount Display** - Responsive text sizing with K/M formatting
- **Tag-Based Organization** - Intuitive unplanned expense styling
- **One-Tap Actions** - Quick repeat transactions from learned patterns

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Awesohme/BudgetBoss.git
cd BudgetBoss

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see BudgetBoss in action!

## 🔧 Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Icons**: Lucide React (professional icon system)
- **Authentication**: Supabase Auth with dual methods
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: IndexedDB (idb-keyval) for offline-first + pattern learning
- **PWA**: Service Worker + Web App Manifest

## 📱 Authentication Flow

### Email/Password Authentication
1. **Sign Up** → Enter email + password → Account created instantly
2. **Sign In** → Enter credentials → Permanent session established
3. **Stay Logged In** → Sessions persist across app restarts and PWA installs

### Magic Link Authentication
1. **Enter Email** → Receive secure link → Click to authenticate
2. **Instant Access** → Automatic login with session persistence

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Code linting
npm audit            # Security vulnerability check
```

## 🔒 Security Features

- **Zero npm vulnerabilities** - Regular security audits
- **Secure session management** - Permanent localStorage sessions
- **Input validation** - Password requirements and data validation
- **Route protection** - Auto-redirect for authenticated users
- **HTTPS enforcement** - Secure communication protocols

## 📦 Key Files

```
src/
├── app/                    # Next.js 15 App Router pages
│   ├── auth/              # Authentication pages
│   ├── plan/              # Budget planning
│   ├── track/             # Expense tracking
│   ├── history/           # Transaction history
│   └── insights/          # Analytics dashboard
├── components/            # Reusable UI components
├── contexts/
│   └── AuthContext.tsx   # Authentication state management
├── lib/
│   ├── supabase.ts       # Supabase client configuration
│   ├── store.ts          # Application state management
│   └── db.ts             # IndexedDB operations
└── hooks/                # Custom React hooks
```

## 🌟 Production Deployment

- **Live Demo**: [https://budget-boss-delta.vercel.app](https://budget-boss-delta.vercel.app)
- **Vercel Deployment**: Optimized for production with proper environment variables
- **PWA Support**: Full offline functionality and installable experience

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com)
- UI components styled with [Tailwind CSS](https://tailwindcss.com)
- PWA functionality powered by custom service workers

---

**BudgetBoss** - Take control of your finances with smart, offline-first budgeting! 💪
