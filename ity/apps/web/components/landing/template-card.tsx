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
        'bg-zinc-900 border border-zinc-800',
        'transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="aspect-[8/5] overflow-hidden bg-zinc-800">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">{template.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300">
          {CATEGORY_LABELS[template.category]}
        </span>
      </div>
    </div>
  );
}
