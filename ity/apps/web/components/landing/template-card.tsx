import { cn } from '@ity/ui/utils';
import { CATEGORY_LABELS } from '@/lib/templates/registry';
import type { Template } from '@/lib/templates/registry';

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <div
      className={cn(
        'group cursor-pointer rounded-lg overflow-hidden',
        'bg-zinc-900/60 backdrop-blur-xl border border-white/[0.06]',
        'transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] hover:scale-[1.02] hover:border-white/[0.1]'
      )}
      onClick={onClick}
    >
      <div className="aspect-[8/5] overflow-hidden bg-white/[0.03]">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--content-heading)' }}>{template.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#bfdbfe]/10 text-[#bfdbfe]/80">
          {CATEGORY_LABELS[template.category]}
        </span>
      </div>
    </div>
  );
}
