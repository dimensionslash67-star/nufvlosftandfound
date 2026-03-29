'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function CSVImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    imported?: number;
    failed?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const upload = async () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/import', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="space-y-5 rounded-lg bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">CSV Import</h2>
        <p className="mt-2 text-sm text-slate-500">
          Expected columns: itemName, description, category, location, contactInfo, imageUrl, status, dateReported
        </p>
      </div>

      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-navy/20 bg-slate-50 p-6 text-center">
        <input
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
        <p className="font-semibold text-brand-navy">{file ? file.name : 'Drop CSV here or click to browse'}</p>
      </label>

      <Button onClick={upload} type="button">
        Import CSV
      </Button>

      {result ? (
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{result.message ?? 'Import finished'}</p>
          <p className="mt-2">Imported: {result.imported ?? 0}</p>
          <p>Failed: {result.failed ?? 0}</p>
          {result.errors?.length ? (
            <ul className="mt-3 list-disc pl-5">
              {result.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

