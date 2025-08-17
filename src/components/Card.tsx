interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'glass'
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseClasses = 'rounded-xl transition-all duration-200 ease-out'
  
  const variantClasses = {
    default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5',
    elevated: 'bg-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-1',
    bordered: 'bg-white border-2 border-gray-200 shadow-none hover:border-gray-300',
    glass: 'glass-effect border border-white/20 shadow-lg backdrop-blur-sm'
  }
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CardTitle({ children, className = '', size = 'md' }: CardTitleProps) {
  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-bold'
  }
  
  return (
    <h3 className={`${sizeClasses[size]} text-gray-900 tracking-tight ${className}`}>
      {children}
    </h3>
  )
}