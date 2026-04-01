'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@ity/ui/utils';
import { getSignedUploadUrl, getPublicStorageUrl } from '@/app/actions/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageUploadWidgetProps {
  shape: 'circle' | 'square';
  path: string;
  currentImageUrl?: string;
  onUploadComplete: (publicUrl: string) => void;
  onRemove?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// ---------------------------------------------------------------------------
// CircularProgress SVG
// ---------------------------------------------------------------------------

function CircularProgress({ percent }: { percent: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg className="absolute inset-0 m-auto" width="100" height="100" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="white"
        strokeOpacity={0.3}
        strokeWidth={6}
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.15s ease' }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ImageUploadWidget
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploadWidget({
  shape,
  path,
  currentImageUrl,
  onUploadComplete,
  onRemove,
}: ImageUploadWidgetProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setError(null);

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se aceptan JPG, PNG o WebP');
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo debe ser menor a 5 MB');
      return;
    }

    // Validate dimensions (min 200x200)
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < 200 || dimensions.height < 200) {
        setError('La imagen debe ser al menos 200x200 px');
        return;
      }
    } catch {
      setError('No se pudo leer la imagen');
      return;
    }

    // Get signed URL from Server Action
    const result = await getSignedUploadUrl(path);
    if (!result.data) {
      setError('Error al preparar la subida');
      return;
    }

    // Upload via XHR with progress
    setProgress(0);
    try {
      await uploadToSignedUrl(result.data.signedUrl, file, (pct) => setProgress(pct));
      const publicUrl = getPublicStorageUrl(path) + '?t=' + Date.now();
      setImageUrl(publicUrl);
      setProgress(null);
      onUploadComplete(getPublicStorageUrl(path)); // clean URL without cache-bust
    } catch {
      setError('Error al subir el archivo');
      setProgress(null);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleRemove = () => {
    setImageUrl(null);
    setError(null);
    onRemove?.();
  };

  return (
    <div className="relative">
      {/* Clickable upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex items-center justify-center w-[120px] h-[120px] cursor-pointer border-2 border-dashed transition-colors overflow-hidden',
          shape === 'circle' ? 'rounded-full' : 'rounded-xl',
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500',
          progress !== null && 'pointer-events-none' // disable clicks during upload
        )}
      >
        {/* State: has image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={cn(
              'w-full h-full object-cover',
              shape === 'circle' ? 'rounded-full' : 'rounded-xl'
            )}
          />
        ) : (
          /* State: placeholder */
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Subir imagen</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <CircularProgress percent={progress} />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Delete button — only when image exists and not uploading */}
      {imageUrl && progress === null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 hover:bg-red-600 hover:text-white transition-colors"
          aria-label="Eliminar imagen"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Inline error */}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
