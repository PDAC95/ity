'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@ity/ui/utils';
import { profileFormSchema, type ProfileFormInput } from '@/lib/validations/profile';
import { trpc } from '@/lib/trpc/client';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
import { BasicInfoCard } from './basic-info-card';
import { ContactCard } from './contact-card';
import { SocialLinksCard } from './social-links-card';
import { ProfilePreview } from './profile-preview';
import { AvatarCropModal } from './avatar-crop-modal';
import type { SocialLinks } from '@ity/db';
import { useI18n } from '@/lib/i18n/context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorData {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  contactEmail: string | null;
  socialLinks: SocialLinks | null;
}

interface SchoolData {
  name: string;
  branding: { logo?: string; primaryColor: string } | null;
}

export interface ProfileFormProps {
  creator: CreatorData;
  school: SchoolData | null;
}

// ---------------------------------------------------------------------------
// ProfileForm
// ---------------------------------------------------------------------------

export function ProfileForm({ creator, school }: ProfileFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(creator.avatarUrl);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: creator.name ?? '',
      bio: creator.bio ?? '',
      contactEmail: creator.contactEmail ?? '',
      socialLinks: {
        instagram: creator.socialLinks?.instagram ?? '',
        x: creator.socialLinks?.x ?? '',
        youtube: creator.socialLinks?.youtube ?? '',
        tiktok: creator.socialLinks?.tiktok ?? '',
        linkedin: creator.socialLinks?.linkedin ?? '',
        facebook: creator.socialLinks?.facebook ?? '',
      },
    },
  });

  const {
    handleSubmit,
    formState: { isDirty, isSubmitting },
    reset,
  } = form;

  // Unsaved changes guard (beforeunload)
  useUnsavedChanges(isDirty);

  // tRPC mutation
  const updateMutation = trpc.creators.update.useMutation({
    onSuccess: (data) => {
      toast.success('Perfil actualizado');
      reset({
        name: data.name,
        bio: data.bio ?? '',
        contactEmail: data.contactEmail ?? '',
        socialLinks: {
          instagram: data.socialLinks?.instagram ?? '',
          x: data.socialLinks?.x ?? '',
          youtube: data.socialLinks?.youtube ?? '',
          tiktok: data.socialLinks?.tiktok ?? '',
          linkedin: data.socialLinks?.linkedin ?? '',
          facebook: data.socialLinks?.facebook ?? '',
        },
      });
      router.refresh();
    },
    onError: () => {
      toast.error('Error al guardar. Inténtalo de nuevo.');
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = trpc.creators.update.useMutation({
    onSuccess: () => {
      setAvatarUrl(null);
      toast.success('Foto eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la foto');
    },
  });

  const onSubmit = (data: ProfileFormInput) => {
    // Convert empty social link strings to undefined
    const socialLinks = data.socialLinks
      ? Object.fromEntries(
          Object.entries(data.socialLinks).map(([k, v]) => [k, v === '' ? undefined : v])
        )
      : undefined;

    updateMutation.mutate({
      name: data.name,
      bio: data.bio || null,
      contactEmail: data.contactEmail,
      socialLinks: socialLinks as SocialLinks,
    });
  };

  // Avatar file select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast.error('Solo se aceptan JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 5 MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
  };

  const handleCropComplete = (publicUrl: string) => {
    setCropImageSrc(null);
    setAvatarUploading(true);
    // Persist the avatar URL via tRPC
    updateMutation.mutate(
      { avatarUrl: publicUrl },
      {
        onSettled: () => setAvatarUploading(false),
        onSuccess: () => {
          setAvatarUrl(publicUrl + '?t=' + Date.now());
          toast.success('Foto actualizada');
        },
      }
    );
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const handleDeleteAvatar = () => {
    deleteAvatarMutation.mutate({ avatarUrl: null });
  };

  const initials = getInitials(form.watch('name') || creator.name || 'U');
  const avatarColor = getAvatarColor(form.watch('name') || creator.name || 'U');

  return (
    <>
      {/* Avatar crop modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          userId={creator.id}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left column: avatar + cards */}
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-3 glass-card p-5">
                <div className="relative">
                  {/* Avatar circle */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="relative h-28 w-28 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]/30 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    aria-label="Cambiar foto de perfil"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex h-full w-full items-center justify-center text-2xl font-semibold text-white',
                          avatarColor
                        )}
                      >
                        {initials}
                      </div>
                    )}

                    {/* Upload spinner overlay */}
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Avatar actions */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="text-xs font-medium text-[#bfdbfe] hover:text-[#93c5fd] transition-colors disabled:opacity-50"
                  >
                    {t('profile.changePhoto')}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={deleteAvatarMutation.isPending || avatarUploading}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {t('profile.deletePhoto')}
                    </button>
                  )}
                  <p className="text-[10px]" style={{ color: 'var(--content-muted)' }}>JPG, PNG o WebP · Máx. 5 MB</p>
                </div>
              </div>

              {/* Form cards */}
              <BasicInfoCard />
              <ContactCard />
              <SocialLinksCard />
            </div>

            {/* Right column: live preview + save button */}
            <div className="hidden lg:block space-y-5">
              <ProfilePreview school={school} avatarUrl={avatarUrl} creatorName={creator.name} creatorBio={creator.bio} />
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending || !isDirty}
                className="flex w-full items-center justify-center gap-2 glass-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isSubmitting || updateMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('profile.saving')}</>
                ) : (
                  t('profile.save')
                )}
              </button>
            </div>
          </div>

          {/* Mobile: preview + save button */}
          <div className="mt-8 space-y-5 lg:hidden">
            <ProfilePreview school={school} avatarUrl={avatarUrl} creatorName={creator.name} creatorBio={creator.bio} />
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending || !isDirty}
              className="flex w-full items-center justify-center gap-2 glass-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isSubmitting || updateMutation.isPending) ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
