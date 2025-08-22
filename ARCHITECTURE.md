# 🏗️ BudgetBoss Architecture

This document outlines the technical architecture, design patterns, and implementation details of BudgetBoss v4.2.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Data Architecture](#data-architecture)
- [Smart Pattern Learning](#smart-pattern-learning)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Offline-First Strategy](#offline-first-strategy)
- [Performance Optimizations](#performance-optimizations)

## 🎯 System Overview

BudgetBoss is built as a **Progressive Web App (PWA)** with an **offline-first** architecture, featuring intelligent pattern learning and real-time financial insights.

### Core Principles
- **Offline-First**: All functionality works without internet connection
- **Progressive Enhancement**: Enhanced features when online
- **Intelligent Learning**: Adapts to user behavior patterns
- **Real-Time Insights**: Instant financial position updates
- **Data Consistency**: Reliable sync between local and cloud storage

### Technology Stack

```typescript
Frontend Framework:     Next.js 15 (App Router)
Language:              TypeScript (Strict Mode)
Styling:               Tailwind CSS + CSS Variables
Icons:                 Lucide React
Database:              Supabase PostgreSQL + IndexedDB
Authentication:        Supabase Auth (Dual Methods)
Storage:               IndexedDB (idb-keyval)
PWA:                   Service Worker + Web App Manifest
Deployment:            Vercel (Production Optimized)
```

## 🗃️ Data Architecture

### Core Data Models

```typescript
// Financial Core
interface Budget {
  id: string
  user_id: string
  month: string        // YYYY-MM format
  name: string
  created_at: string
  updated_at: string
  deleted?: boolean
}

interface Income {
  id: string
  budget_id: string
  name: string
  amount: number
  created_at: string
  updated_at: string
  deleted?: boolean
}

interface Category {
  id: string
  budget_id: string
  name: string
  budgeted: number
  borrowed: number     // Can be negative if lent out
  color: string
  notes?: string
  created_at: string
  updated_at: string
  deleted?: boolean
}

interface Transaction {
  id: string
  budget_id: string
  category_id?: string
  amount: number
  description: string
  account: string
  is_unplanned: boolean
  date: string
  created_at: string
  updated_at: string
  deleted?: boolean
}

// Smart Pattern Learning (New v4.2)
interface TransactionPattern {
  id: string
  description: string
  category_id: string
  count: number
  last_amount: number
  last_used: string
  created_at: string
  updated_at: string
}
```

### Data Flow Architecture

```
User Action → Store Action → IndexedDB Write → UI Update
     ↓
Background Sync → Supabase → Conflict Resolution → Local Update
```

## 🧠 Smart Pattern Learning

### Pattern Recognition System

The pattern learning system automatically tracks user behavior to suggest frequent transactions:

```typescript
// Pattern Learning Logic
class PatternLearner {
  // Triggers on every transaction
  async updatePattern(description: string, categoryId: string, amount: number) {
    const patterns = await db.getPatterns()
    const existingPattern = patterns.find(p => 
      p.description === description && p.category_id === categoryId
    )
    
    if (existingPattern) {
      // Update frequency and last usage
      existingPattern.count += 1
      existingPattern.last_amount = amount
      existingPattern.last_used = new Date().toISOString()
    } else {
      // Create new pattern
      patterns.push(new TransactionPattern({
        description, category_id: categoryId, 
        count: 1, last_amount: amount
      }))
    }
    
    await db.savePatterns(patterns)
  }
  
  // Suggests patterns with 3+ occurrences
  async getFrequentPatterns(limit = 3) {
    const patterns = await db.getPatterns()
    return patterns
      .filter(p => p.count >= 3)
      .sort((a, b) => {
        // Sort by frequency, then recency
        if (b.count !== a.count) return b.count - a.count
        return new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
      })
      .slice(0, limit)
  }
}
```

### Pattern Storage Strategy

```typescript
// IndexedDB Storage Keys
const PATTERNS_KEY = 'patterns'
const PLAN_KEY = (month: string) => `plan:${month}`
const TX_KEY = (id: string) => `tx:${id}`

// Storage Implementation
export const db = {
  // Pattern operations
  async getPatterns(): Promise<TransactionPattern[]>
  async savePatterns(patterns: TransactionPattern[]): Promise<void>
  async updatePattern(description: string, categoryId: string, amount: number): Promise<void>
  async getFrequentPatterns(minCount = 3, limit = 3): Promise<TransactionPattern[]>
}
```

## 🏗️ Component Architecture

### Component Hierarchy

```
App Layout
├── AuthContext Provider
├── PWAUpdateManager
├── BottomNavigation
├── Pages
│   ├── HomePage
│   │   ├── MonthSwitcher
│   │   ├── BudgetOverview
│   │   ├── QuickRepeat (New v4.2)
│   │   └── RecentTransactions
│   ├── PlanPage
│   ├── TrackPage
│   ├── HistoryPage
│   ├── InsightsPage
│   │   ├── CategoryPerformance
│   │   ├── MostExpensiveCategories (New v4.2)
│   │   └── CategoryBorrowing (Moved from Home)
│   └── AuthPage
└── Global Modals
    ├── QuickAdd
    ├── BorrowModal
    └── ConfirmModal
```

### New Component: QuickRepeat

```typescript
// Smart Pattern-Based Transaction Suggestions
interface QuickRepeatProps {
  onSuccess?: () => void
}

export function QuickRepeat({ onSuccess }: QuickRepeatProps) {
  const [patterns, setPatterns] = useState<FrequentPattern[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)

  // Load patterns on mount
  useEffect(() => {
    const loadPatterns = async () => {
      const frequentPatterns = await store.getFrequentPatterns()
      setPatterns(frequentPatterns)
    }
    loadPatterns()
  }, [])

  // One-tap transaction creation
  const handleQuickAdd = async (pattern: FrequentPattern) => {
    await store.addTransaction({
      amount: pattern.amount.toString(),
      category_id: pattern.categoryId,
      description: pattern.description,
      account: 'Cash', // Default for quick adds
      is_unplanned: false
    })
    onSuccess?.()
  }

  // Shows patterns or learning message
  return patterns.length === 0 ? (
    <LearningMessage />
  ) : (
    <PatternButtons patterns={patterns} onAdd={handleQuickAdd} />
  )
}
```

## 🔄 State Management

### Enhanced Store Architecture (v4.2)

```typescript
export class BudgetStore {
  // Enhanced Calculation Methods
  getBudgetRemaining(): number {
    const totalBudgeted = this.getTotalBudgeted()
    const totalSpent = this.getTotalSpent()
    const totalUnplanned = this.getTotalUnplannedSpent()
    
    // Amount that should be in bank = budgeted - spent - unplanned
    return (totalBudgeted - totalSpent) - totalUnplanned
  }

  getIncomeAllocationLeft(): number {
    const totalIncome = this.getTotalIncome()
    const totalBudgeted = this.getTotalBudgeted()
    // Truly unbudgeted money
    return totalIncome - totalBudgeted
  }

  // Pattern Integration
  async getFrequentPatterns(): Promise<Array<{
    description: string
    categoryName: string
    amount: number
    categoryId: string
  }>> {
    const patterns = await db.getFrequentPatterns()
    return patterns.map(pattern => {
      const category = this.state.categories.find(c => c.id === pattern.category_id)
      return {
        description: pattern.description,
        categoryName: category?.name || 'Unknown',
        amount: pattern.last_amount,
        categoryId: pattern.category_id
      }
    }).filter(p => p.categoryName !== 'Unknown')
  }

  // Enhanced Analytics
  getMostExpensiveCategories(): Array<{
    name: string
    spent: number
    color: string
  }> {
    return this.getCategoriesWithSpent()
      .filter(category => category.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(category => ({
        name: category.name,
        spent: category.spent,
        color: category.color
      }))
  }

  // Pattern Learning Integration
  async addTransaction(data: QuickAddData): Promise<void> {
    // ... existing transaction logic ...
    
    // Update pattern tracking for non-unplanned transactions
    if (!data.is_unplanned && categoryId) {
      await db.updatePattern(data.description, categoryId, parseFloat(data.amount))
    }
  }
}
```

### State Update Flow

```typescript
// Transaction Creation Flow with Pattern Learning
User Input → QuickAdd Form → Store.addTransaction() → {
  1. Create Transaction Object
  2. Update Local State
  3. Save to IndexedDB
  4. Update Pattern (if applicable)
  5. Mark for Sync
  6. Notify UI Components
}

// Pattern-Based Quick Add Flow
User Tap → QuickRepeat Component → Store.addTransaction() → {
  1. Use Pre-filled Pattern Data
  2. Create Transaction
  3. Update Pattern Count
  4. Refresh Suggestions
  5. Show Success State
}
```

## 🔐 Authentication Flow

### Dual Authentication System

```typescript
// AuthContext provides centralized auth state
interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

// Permanent Session Configuration
const supabase = createClient(url, key, {
  auth: {
    storage: window.localStorage,
    storageKey: 'budgetboss-auth-token',
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
```

### Authentication States

```typescript
enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

// Route Protection
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  if (!user) redirect('/auth')
  
  return <>{children}</>
}
```

## 🔄 Offline-First Strategy

### Data Synchronization

```typescript
// Sync Strategy
interface SyncOperation {
  operation: 'create' | 'update' | 'delete'
  table: string
  id: string
  data?: any
  timestamp: string
}

class SyncService {
  // Background sync when online
  async fullSync(month: string, userId: string) {
    const pendingChanges = await db.getSyncState()
    
    for (const changeId of pendingChanges.pendingChanges) {
      try {
        await this.syncItem(changeId)
        await db.markSynced(changeId)
      } catch (error) {
        console.error(`Sync failed for ${changeId}:`, error)
        // Keep in pending for retry
      }
    }
  }

  // Conflict resolution
  private async resolveConflict(local: any, remote: any) {
    // Last-write-wins strategy
    return new Date(remote.updated_at) > new Date(local.updated_at) 
      ? remote 
      : local
  }
}
```

### IndexedDB Storage Strategy

```typescript
// Storage Keys Organization
const STORAGE_KEYS = {
  // Monthly data isolation
  PLAN: (month: string) => `plan:${month}`,
  
  // Transaction storage with indexing
  TRANSACTION: (id: string) => `tx:${id}`,
  TRANSACTION_INDEX: (month: string) => `txindex:${month}`,
  
  // Pattern learning
  PATTERNS: 'patterns',
  
  // App state
  SETTINGS: 'settings',
  SYNC_STATE: 'syncState'
}
```

## ⚡ Performance Optimizations

### Smart Loading Strategies

```typescript
// Component-level optimizations
const QuickRepeat = memo(function QuickRepeat({ onSuccess }) {
  // Memoized pattern calculation
  const patterns = useMemo(() => {
    return frequentPatterns.filter(p => p.categoryName !== 'Unknown')
  }, [frequentPatterns])

  // Debounced pattern updates
  const debouncedUpdatePattern = useCallback(
    debounce(async (description, categoryId, amount) => {
      await db.updatePattern(description, categoryId, amount)
    }, 300),
    []
  )
})

// Virtual scrolling for large transaction lists
const TransactionHistory = () => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const visibleTransactions = transactions.slice(visibleRange.start, visibleRange.end)
  
  return (
    <VirtualizedList
      items={visibleTransactions}
      onRangeChange={setVisibleRange}
    />
  )
}
```

### Bundle Optimization

```typescript
// Dynamic imports for large dependencies
const ExcelJS = lazy(() => import('exceljs'))

// Code splitting by route
const InsightsPage = lazy(() => import('./insights/page'))
const HistoryPage = lazy(() => import('./history/page'))

// Service worker caching strategy
const SW_CONFIG = {
  // Cache API responses
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'api-cache' }
    }
  ]
}
```

### Icon System Optimization

```typescript
// Tree-shakable icon imports
import { DollarSign, AlertTriangle, Zap } from 'lucide-react'

// Centralized icon mapping
const ICONS = {
  MONEY: DollarSign,
  WARNING: AlertTriangle,
  ENERGY: Zap,
  // ... other icons
} as const

// Icon component wrapper
interface IconProps {
  name: keyof typeof ICONS
  className?: string
}

function Icon({ name, className }: IconProps) {
  const IconComponent = ICONS[name]
  return <IconComponent className={className} />
}
```

## 📊 Monitoring and Analytics

### Performance Tracking

```typescript
// Performance metrics
interface PerformanceMetrics {
  patternLearningTime: number
  transactionAddTime: number
  syncDuration: number
  renderTime: number
}

// Error boundary with reporting
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('BudgetBoss Error:', { error, errorInfo })
    
    // Track pattern learning errors separately
    if (error.message.includes('pattern')) {
      this.reportPatternError(error)
    }
  }
}
```

---

## 🔮 Future Architecture Considerations

### Planned Enhancements
- **Multi-user Budget Sharing** - Real-time collaborative budgeting
- **Advanced Pattern Recognition** - ML-based spending predictions
- **Widget System** - Extensible dashboard components
- **Advanced Analytics** - Spending trends and forecasting
- **Multiple Currency Support** - International usage expansion

### Scalability Preparations
- **Microservices Architecture** - Split services for better scaling
- **Edge Caching** - CDN optimization for global users
- **Database Optimization** - Query optimization and indexing
- **Component Library** - Reusable UI component system

---

This architecture document serves as a comprehensive guide to understanding and contributing to BudgetBoss. For specific implementation details, refer to the source code and inline documentation.