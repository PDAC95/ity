'use client';

import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, Loader2 } from 'lucide-react';
import { getSignedUploadUrl, getPublicStorageUrl } from '@/app/actions/storage';

// ---------------------------------------------------------------------------
// Canvas helper — crops image to the selected area and returns a Blob
// ---------------------------------------------------------------------------

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

// ---------------------------------------------------------------------------
// XHR upload to signed URL
// ---------------------------------------------------------------------------

function uploadBlobToSignedUrl(signedUrl: string, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    xhr.send(blob);
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AvatarCropModalProps {
  imageSrc: string;
  userId: string;
  onComplete: (publicUrl: string) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// AvatarCropModal
// ---------------------------------------------------------------------------

export function AvatarCropModal({ imageSrc, userId, onComplete, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCancel = () => {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setUploading(true);
    setError(null);

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      const path = `profiles/${userId}/avatar`;
      const result = await getSignedUploadUrl(path);

      if (!result.data) {
        setError('Error al preparar la subida');
        setUploading(false);
        return;
      }

      await uploadBlobToSignedUrl(result.data.signedUrl, blob);

      const publicUrl = getPublicStorageUrl(path);
      URL.revokeObjectURL(imageSrc);
      onComplete(publicUrl);
    } catch {
      setError('Error al subir la imagen. Inténtalo de nuevo.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md rounded-xl bg-zinc-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Recortar foto de perfil</h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-zinc-800">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs text-zinc-400">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Error */}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {uploading ? 'Subiendo...' : 'Recortar y subir'}
          </button>
        </div>
      </div>
    </div>
  );
}
