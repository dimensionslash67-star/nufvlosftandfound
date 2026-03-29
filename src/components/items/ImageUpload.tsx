'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadConfig } from '@/lib/upload';

export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value ?? null);
  }, [value]);

  const uploadFile = (file: File) => {
    setError(null);

    if (!uploadConfig.allowedMimeTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > uploadConfig.maxFileSize) {
      setError(`Please keep files under ${Math.round(uploadConfig.maxFileSize / 1024 / 1024)}MB.`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/items/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);

      try {
        const response = JSON.parse(xhr.responseText) as { message?: string; url?: string };

        if (xhr.status >= 200 && xhr.status < 300 && response.url) {
          setPreviewUrl(response.url);
          onChange(response.url);
          URL.revokeObjectURL(localPreview);
          return;
        }

        setError(response.message ?? 'Image upload failed.');
      } catch {
        setError('Image upload failed.');
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError('Image upload failed.');
    };

    xhr.send(formData);
  };

  return (
    <div className="space-y-3">
      <div
        className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-navy/20 bg-slate-50 p-6 text-center transition hover:border-brand-navy/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];

          if (file) {
            uploadFile(file);
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          accept={uploadConfig.allowedMimeTypes.join(',')}
          className="hidden"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              uploadFile(file);
            }
          }}
        />

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Uploaded preview"
            className="mb-4 h-40 w-full rounded-2xl object-cover"
            src={previewUrl}
          />
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-brand-gold/20 text-3xl text-brand-navy">
            +
          </div>
        )}

        <p className="text-sm font-semibold text-brand-navy">Drag and drop an image here</p>
        <p className="mt-2 text-sm text-slate-500">
          or click to browse. Max {Math.round(uploadConfig.maxFileSize / 1024 / 1024)}MB.
        </p>
      </div>

      {isUploading ? (
        <div className="overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-brand-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {previewUrl ? (
        <button
          className="text-sm font-semibold text-red-600 hover:text-red-700"
          type="button"
          onClick={() => {
            setPreviewUrl(null);
            setProgress(0);
            setError(null);
            onChange(null);
          }}
        >
          Remove image
        </button>
      ) : null}
    </div>
  );
}

