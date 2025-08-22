# Changelog

All notable changes to BudgetBoss will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.0] - 2025-08-21

### 🚀 Major Features Added

#### Smart Pattern Learning System
- **Automatic Transaction Pattern Recognition** - Learns from user behavior to suggest frequent transactions
- **Quick Repeat Transactions** - One-tap transaction creation from learned patterns
- **Intelligent Suggestions** - Shows top 3 most frequent transaction patterns after 3+ occurrences
- **Persistent Pattern Storage** - Uses IndexedDB to maintain patterns across sessions

#### Dashboard Logic Overhaul  
- **"Amount in Bank" Calculation** - Replaced confusing "Budget Remaining" with actual amount meant to be in bank account
- **Enhanced Financial Logic** - Unplanned expenses now properly reduce available bank balance
- **Income Allocation Clarity** - Shows truly unbudgeted money vs allocated funds
- **Real-Time Insights** - More accurate financial position tracking

#### Professional Design System
- **Lucide React Icons** - Replaced all emoji icons with professional icon components
- **Consistent Visual Language** - Modern icon system throughout application
- **Better Accessibility** - Screen reader friendly icon implementation
- **Enhanced Aesthetics** - Clean, professional appearance across all interfaces

### ✨ User Experience Improvements

#### Streamlined Interactions
- **Direct Time Picker** - Custom date/time selection without intermediate input fields
- **Smart Transaction Tags** - Unplanned expenses styled as intuitive tags in transaction history
- **One-Tap Quick Actions** - Reduced friction for common transaction patterns

#### Better Organization
- **Category Borrowing to Insights** - Moved borrowing section from home to insights page for better focus
- **Expense-Based Analytics** - Most expensive categories replace frequency-based analysis
- **Home Page Optimization** - Quick repeat transactions replace category borrowing for better UX

### 🛠️ Technical Improvements

#### Enhanced Data Architecture
- **New TransactionPattern Interface** - Added to models.ts for pattern tracking
- **Pattern Storage in IndexedDB** - New PATTERNS_KEY for persistent pattern learning
- **Enhanced Store Methods** - getBudgetRemaining() and getIncomeAllocationLeft() logic improvements
- **Backward Compatibility** - All existing data structures preserved

#### Component System Updates
- **New QuickRepeat Component** - Smart transaction suggestion interface
- **Enhanced QuickAdd Component** - Streamlined time picker UX
- **Modern Icon Integration** - Lucide React imports throughout all components

### 📦 Dependencies
- **Added**: `lucide-react@^0.540.0` - Professional icon system

### 🐛 Bug Fixes
- **Fixed**: Calculation logic for budget remaining (now shows actual bank amount)
- **Fixed**: Unplanned expenses properly reduce available balance
- **Fixed**: Time picker UX flow (direct activation without intermediate steps)

---

## [4.1.0] - 2025-08-17

### 🚀 Major Features Added

#### Dual Authentication System
- **Email/Password Authentication** - Traditional login alongside magic links
- **Instant Account Creation** - No email verification required for immediate access
- **Permanent Session Management** - Users stay logged in indefinitely (perfect for PWA)
- **AuthContext Integration** - Centralized authentication state management

#### Enhanced User Experience
- **Auto-redirect Protection** - Authenticated users automatically redirected from auth page
- **Universal Refresh Action** - Consistent "Tap to refresh" functionality for all states
- **Improved Header UX** - Removed conditional welcome messages for cleaner interface

### 🛠️ Technical Improvements
- **Next.js 15 Compatibility** - Full App Router and Suspense boundaries support
- **TypeScript Strict Mode** - Enhanced code quality and type safety
- **Zero Security Vulnerabilities** - Complete dependency security audit
- **Production Deployment Optimization** - Vercel-ready with proper environment variables

---

## [4.0.0] - 2025-08-15

### 🚀 Initial Major Release

#### Core Features
- **Offline-First PWA** - Full functionality without internet connection
- **Monthly Budget Planning** - Income and category-based system
- **Transaction Tracking** - Enforced descriptions with category assignment
- **Category Borrowing** - Flexible budget adjustments between categories
- **Nigerian Naira Support** - Smart currency formatting with K/M abbreviations

#### Analytics & Insights
- **Category Health Monitoring** - 80% warnings and overspent alerts
- **Spending Analysis** - Most/least frequent category tracking
- **Performance Metrics** - Savings and overspent category reporting
- **Visual Progress Bars** - Category spending visualization

#### Technical Foundation
- **Next.js 15** - Modern React framework with App Router
- **Supabase Integration** - PostgreSQL database with Row Level Security
- **IndexedDB Storage** - Offline-first data persistence
- **Service Worker** - PWA capabilities with caching
- **TypeScript** - Full type safety throughout application

---

## Contributing

When adding entries to this changelog:

1. **Follow the format** - Use the established structure with version numbers and dates
2. **Categorize changes** - Use appropriate sections (Added, Changed, Fixed, etc.)
3. **Be descriptive** - Include context about why changes were made
4. **Link to issues** - Reference GitHub issues when applicable
5. **Keep it user-focused** - Explain changes from the user's perspective

## Links

- [Repository](https://github.com/Awesohme/BudgetBoss)
- [Live Demo](https://budget-boss-delta.vercel.app)
- [Issues](https://github.com/Awesohme/BudgetBoss/issues)