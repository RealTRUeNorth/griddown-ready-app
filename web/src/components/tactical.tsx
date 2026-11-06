import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Uppercase letter-spaced section header, e.g. "CHECK-IN STATUS · EVERY 6H". */
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-[11px] gd-label text-[#6A6860] mt-6 mb-3', className)}>{children}</div>
  );
}

/** Bordered dark card used across every screen. */
export function TCard({
  children,
  className,
  onClick,
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  testId?: string;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'w-full text-left bg-[#242824] border border-[#3A3F3A] rounded-xl transition-all duration-150',
        onClick && 'hover:border-[#4A504A] hover:bg-[#2A2F2A] active:scale-[0.98] cursor-pointer',
        className
      )}
    >
      {children}
    </Comp>
  );
}

/** Big-number stat card with icon + sublabel. */
export function StatCard({
  icon,
  label,
  value,
  sublabel,
  alert,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  alert?: boolean;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <TCard onClick={onClick} className="p-3.5" testId={testId}>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <span className="text-[10px] gd-label text-[#6A6860]">{label}</span>
      </div>
      <div className="text-2xl font-bold text-[#E8E4DC] font-[Chakra_Petch]">{value}</div>
      <div className={cn('text-xs mt-0.5 text-[#9A9890]', alert && 'text-[#F44336] font-semibold')}>
        {sublabel}
      </div>
    </TCard>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const color =
    percent === 100 ? '#4CAF50' : percent > 50 ? '#FFC107' : '#D4822A';
  return (
    <div className={cn('h-1.5 w-full bg-[#333833] rounded-full overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Small colored pill badge (EXPIRED, OVERDUE, LOW STOCK…). */
export function Chip({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <span
      className={cn('text-[8px] gd-label rounded px-1.5 py-0.5 whitespace-nowrap', className)}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

/** Standard page header with back button and action slot. */
export function PageHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {onBack && (
        <button
          onClick={onBack}
          className="shrink-0 w-8 h-8 rounded-lg bg-[#242824] border border-[#3A3F3A] flex items-center justify-center text-[#9A9890] hover:text-[#E8E4DC] hover:border-[#4A504A] transition-colors"
          aria-label="Back"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-[#E8E4DC] gd-label truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#9A9890] mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Screen-level footer disclaimer. */
export function LocalDataFooter() {
  return (
    <div className="mt-10 py-5 border-t border-[#3A3F3A] text-center">
      <div className="text-[10px] gd-label text-[#6A6860]">ALL DATA STORED LOCALLY</div>
      <div className="text-[11px] text-[#4A504A] mt-1">No account · No tracking · No internet required</div>
    </div>
  );
}
