# BudgetBoss

A local-first budgeting PWA with optional Supabase sync and partner sharing.

## Features

✅ **Core Functionality**
- Monthly budget planning (income, fixed expenses, categories)
- Transaction tracking with forced descriptions (≥3 chars)
- Category borrowing system
- Offline-first with IndexedDB
- PWA with manifest and service worker
- Month-based isolation (YYYY-MM format)

✅ **UI/UX**
- 5 main tabs: Home, Plan, Track, History, Insights
- Bottom navigation
- Month switcher
- Quick Add modal
- Borrow modal
- Responsive design with Tailwind CSS

✅ **Data & Sync**
- Complete Supabase schema with RLS
- Local IndexedDB storage
- Optional cloud sync
- Magic link authentication
- Partner budget sharing capability

✅ **Analytics & Insights**
- Category health monitoring (80% warning, overspent alerts)
- Most/least frequent categories
- Borrowed/lent tracking
- Overspent and savings summaries

## Quick Start

```bash
npm run dev
```

Visit http://localhost:3000

## Recent Fixes Applied

### ✅ Critical Issues Fixed
- **Data Persistence**: Fixed budget creation and data saving in offline mode
- **Copy Previous Button**: Now functional with proper feedback messages
- **Borrow Button**: Fully implemented with confirmation and updates

### ✅ UI/UX Improvements  
- **Currency**: Changed from USD ($) to Nigerian Naira (₦)
- **Modal Sizing**: Expanded modals to be wider but responsive
- **Input Styling**: Fixed white text issue - all inputs now have black text
- **Number Formatting**: Added proper formatting with commas (1,000 not 1000)

### ✅ Functionality Enhancements
- **Offline-First**: App now works completely offline with local budget creation
- **Error Handling**: Added proper feedback for all user actions
- **Copy Previous**: Copies income, categories, and structure (as requested)
- **Borrowing**: Shows confirmation and updates both categories immediately

## Fixed Expense Flow
Per requirements:
- Fixed expenses should be assigned to existing categories
- Form updated accordingly in next iteration

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

## Database

Schema deployed to Supabase project: `tbmazchrtfoohzrarnhi`
Tables: budgets, budget_members, incomes, fixed_expenses, categories, transactions, settings

All tables have RLS enabled with proper policies for user isolation and partner sharing.