import React from 'react';
import { cn, getStatusColor, capitalize } from '../../utils';
import { Loader2 } from 'lucide-react';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', loading, icon, className, disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 focus:ring-gray-400',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

// Badge
interface BadgeProps { status: string; className?: string }
export const StatusBadge: React.FC<BadgeProps> = ({ status, className }) => (
  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(status), className)}>
    {capitalize(status)}
  </span>
);

// Card
interface CardProps { children: React.ReactNode; className?: string; padding?: boolean }
export const Card: React.FC<CardProps> = ({ children, className, padding = true }) => (
  <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700', padding && 'p-6', className)}>
    {children}
  </div>
);

// Stat Card
interface StatCardProps {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; color?: string; trend?: { value: number; positive: boolean };
}
export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color = 'brand', trend }) => (
  <Card>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-500')}>
            <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            <span className="text-gray-400 font-normal">vs last period</span>
          </div>
        )}
      </div>
      <div className={cn(`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex-shrink-0 ml-4`)}>
        <div className={`text-${color}-600 dark:text-${color}-400`}>{icon}</div>
      </div>
    </div>
  </Card>
);

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: React.ReactNode;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'px-3 py-2.5 text-sm placeholder:text-gray-400 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-60',
            icon && 'pl-10',
            error && 'border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, error, options, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
    <select
      className={cn(
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
        'px-3 py-2.5 text-sm transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error && 'border-red-400',
        className
      )}
      {...props}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, error, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
    <textarea
      className={cn(
        'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
        'px-3 py-2.5 text-sm placeholder:text-gray-400 transition-colors duration-200 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        error && 'border-red-400',
        className
      )}
      rows={3}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// Skeleton
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
);

export const CardSkeleton: React.FC = () => (
  <Card>
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-12 h-12 rounded-xl" />
    </div>
  </Card>
);

// Empty State
export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({
  title, description, action, icon
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Modal
interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Toggle Switch
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md' }
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, size = 'md' }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        'relative rounded-full transition-colors duration-200 cursor-pointer',
        size === 'sm' ? 'w-8 h-4' : 'w-11 h-6',
        checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
      )}
    >
      <div className={cn(
        'absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200',
        size === 'sm' ? 'w-3 h-3' : 'w-5 h-5',
        checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'
      )} />
    </div>
    {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
  </label>
);

// Spinner
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={cn('animate-spin text-brand-600', sizes[size], className)} />;
};

// Page Loading
export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Avatar
export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ name, size = 'md', className }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  const colors = ['bg-brand-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0', sizes[size], color, className)}>
      {initials}
    </div>
  );
};

// Pagination
interface PaginationProps { page: number; totalPages: number; onPageChange: (p: number) => void }
export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Prev</Button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
        <Button key={p} size="sm" variant={p === page ? 'primary' : 'outline'} onClick={() => onPageChange(p)}>{p}</Button>
      ))}
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Next</Button>
    </div>
  );
};
