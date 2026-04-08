import { TEMPLATES } from '@/lib/templates/registry';
import { TemplateGallery } from '@/components/landing/template-gallery';

export default function TemplatesPage() {
  return (
    <div className="py-8 px-4 md:px-6">
      <TemplateGallery templates={TEMPLATES} />
    </div>
  );
}
