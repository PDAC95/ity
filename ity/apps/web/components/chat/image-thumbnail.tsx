'use client';

interface ImageThumbnailProps {
  url: string;
  alt?: string;
}

export function ImageThumbnail({ url, alt = 'Imagen adjunta' }: ImageThumbnailProps) {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-2 block overflow-hidden rounded-lg border border-zinc-200 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`Ver imagen completa: ${alt}`}
    >
      <img
        src={url}
        alt={alt}
        className="max-w-[200px] rounded-lg object-contain"
      />
    </button>
  );
}
