'use client';

interface FAQTagChipProps {
  tag: string;
  active: boolean;
  onClick: () => void;
}

export function FAQTagChip({ tag, active, onClick }: FAQTagChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${active
          ? 'bg-[var(--accent-green)] text-white shadow-lg'
          : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--accent-green)]/20 hover:text-[var(--accent-green)]'
        }
      `}
    >
      {tag}
    </button>
  );
}
