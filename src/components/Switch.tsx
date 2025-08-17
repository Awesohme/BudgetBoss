interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  className?: string
}

export function Switch({ checked, onChange, label, description, className = '' }: SwitchProps) {
  return (
    <label className={`flex items-start cursor-pointer ${className}`}>
      <div className="relative mt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`} />
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
          checked ? 'transform translate-x-4' : ''
        }`} />
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className="text-sm font-medium text-gray-900 block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-500 block">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}