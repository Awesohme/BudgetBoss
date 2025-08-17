-- BudgetBoss Database Schema
-- Enable RLS on all tables for security

-- Budgets table (monthly budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM format
    name TEXT NOT NULL DEFAULT 'My Budget',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, month)
);

-- Budget members for sharing (partners)
CREATE TABLE IF NOT EXISTS budget_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_id, user_id)
);

-- Income entries
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE
);

-- Fixed expenses
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE
);

-- Categories for spending
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    budgeted DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (budgeted >= 0),
    borrowed DECIMAL(12,2) NOT NULL DEFAULT 0, -- can be negative if lent out
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 3),
    account TEXT NOT NULL DEFAULT 'Cash',
    is_emergency BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE
);

-- User settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    currency TEXT DEFAULT 'USD',
    first_day_of_week INTEGER DEFAULT 1 CHECK (first_day_of_week >= 0 AND first_day_of_week <= 6),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Users can read own budgets" ON budgets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can read shared budgets" ON budgets
    FOR SELECT USING (
        id IN (
            SELECT budget_id FROM budget_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own budgets" ON budgets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Budget owners can update" ON budgets
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Budget owners can delete" ON budgets
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for budget_members
CREATE POLICY "Users can read budget memberships" ON budget_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget owners can manage members" ON budget_members
    FOR ALL USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for incomes
CREATE POLICY "Budget members can read incomes" ON incomes
    FOR SELECT USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget members can manage incomes" ON incomes
    FOR ALL USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for fixed_expenses
CREATE POLICY "Budget members can read fixed expenses" ON fixed_expenses
    FOR SELECT USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget members can manage fixed expenses" ON fixed_expenses
    FOR ALL USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for categories
CREATE POLICY "Budget members can read categories" ON categories
    FOR SELECT USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget members can manage categories" ON categories
    FOR ALL USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for transactions
CREATE POLICY "Budget members can read transactions" ON transactions
    FOR SELECT USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Budget members can manage transactions" ON transactions
    FOR ALL USING (
        budget_id IN (
            SELECT id FROM budgets WHERE user_id = auth.uid()
            UNION
            SELECT budget_id FROM budget_members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for settings
CREATE POLICY "Users can read own settings" ON settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON settings
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budget_members_budget_user ON budget_members(budget_id, user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_budget ON incomes(budget_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_budget ON fixed_expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_categories_budget ON categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget ON transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);

-- Function to auto-create settings for new users
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();