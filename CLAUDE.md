# BudgetBoss

A modern, offline-first budgeting PWA with cloud sync and partner sharing capabilities.

## 🚀 Latest Updates (v4.0)

### ✅ Modern UI Overhaul
- **Complete design system** with modern CSS variables and component variants
- **Dark mode support** with proper input field visibility across all themes
- **Smart amount formatting** with K/M abbreviations for large numbers
- **Responsive text sizing** that adapts to amount length
- **Gradient backgrounds** and contemporary visual design
- **Enhanced mobile experience** with proper overflow handling

### ✅ Authentication & Cloud Sync
- **Magic link authentication** with Supabase integration
- **Production-ready callback system** with proper URL handling
- **Rate limiting protection** with user-friendly error messages
- **Environment variable security** properly configured for deployment
- **Session persistence** across app restarts and PWA installs

### ✅ Core Features

**💰 Budget Management**
- Monthly budget planning (income + categories system)
- Transaction tracking with forced descriptions (≥3 chars)
- Category borrowing system for flexible budget adjustments
- Smart amount display with responsive formatting
- Nigerian Naira (₦) currency support

**📱 Progressive Web App**
- Offline-first with IndexedDB storage
- Service worker for caching and offline functionality
- Web app manifest for native-like installation
- Month-based data isolation (YYYY-MM format)

**🎨 User Interface**
- 5 main sections: Home, Plan, Track, History, Insights
- Modern card-based design with hover effects
- Quick Add modal for fast transaction entry
- Borrow modal for category fund transfers
- Responsive design optimized for all devices

**📊 Analytics & Insights**
- Category health monitoring (80% warning, overspent alerts)
- Most/least frequent category analysis
- Borrowed/lent tracking with visual summaries
- Overspent and savings performance metrics

## Quick Start

```bash
npm run dev
```

Visit http://localhost:3000

## 🛠️ Technical Improvements

### ✅ Performance & Security
- **Zero npm vulnerabilities** - All dependencies are secure
- **Next.js 15 compatibility** with App Router and Suspense boundaries
- **TypeScript strict mode** for enhanced code quality
- **Production deployment** optimized for Vercel
- **Environment variable security** with proper key management

### ✅ Data Management Evolution
- **Simplified budget model** - Removed fixed expenses, unified to categories
- **Enhanced state management** with improved selectors and actions
- **Better error handling** throughout the application
- **Offline data persistence** with reliable IndexedDB operations

### ✅ Recent Critical Fixes
- **Authentication flow** - Complete magic link implementation
- **Mobile UI overflow** - Smart text sizing and responsive amounts
- **Dark mode inputs** - Proper visibility across all form elements
- **Production deployment** - Resolved all build and runtime issues
- **Rate limiting** - Graceful handling of Supabase email limits

## Architecture

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: Supabase with PostgreSQL + RLS
- **Storage**: IndexedDB (idb-keyval) for offline-first
- **Auth**: Supabase Auth with magic links
- **PWA**: Service Worker + Web App Manifest

## Key Files

- `src/lib/store.ts` - Main application store with actions/selectors
- `src/lib/db.ts` - IndexedDB layer
- `src/lib/sync.ts` - Supabase sync operations
- `src/lib/models.ts` - TypeScript interfaces
- `supabase/migrations/` - Database schema
- `src/app/` - Next.js pages (home, plan, track, history, insights, auth)

## Environment Variables

See `.env.local` for Supabase configuration.

## 🗄️ Database & Deployment

**Supabase Configuration:**
- **Project**: `tbmazchrtfoohzrarnhi.supabase.co`
- **Tables**: budgets, budget_members, incomes, categories, transactions, settings
- **Row Level Security** enabled with proper user isolation policies
- **Magic link authentication** with email domain configuration

**Production Deployment:**
- **Vercel**: https://budget-boss-delta.vercel.app
- **Custom domains** configured in Supabase for proper redirects
- **Environment variables** secured and properly configured
- **PWA capabilities** enabled for offline functionality

## 🧪 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Quality Assurance
npm audit            # Security vulnerability check
npm run lint         # Code linting (if configured)
npm run type-check   # TypeScript type checking
```

## 📝 Latest Session Summary

**Completed in this session:**
1. ✅ **Modern UI overhaul** - Complete design system with dark mode
2. ✅ **Authentication debugging** - Resolved API key and rate limiting issues  
3. ✅ **Mobile responsiveness** - Fixed overflow and text sizing problems
4. ✅ **Production deployment** - Working Vercel deployment with proper configs
5. ✅ **Security audit** - Zero vulnerabilities, clean codebase
6. ✅ **Documentation update** - Comprehensive CLAUDE.md with latest features

**Current Status:** 
- 🟢 **Production Ready** - Fully deployed and functional
- 🟢 **Secure** - No security vulnerabilities detected
- 🟢 **Modern UI** - Contemporary design with dark mode support
- 🟢 **Authentication** - Working magic link system with cloud sync
- 🟢 **Offline Capable** - Full PWA functionality maintained