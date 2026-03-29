'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const LEGACY_CATEGORY_OPTIONS = [
  'Electronics',
  'Books',
  'School Supplies',
  'Clothing',
  'Accessories',
  'Bags',
  'Jewelry',
  'Personal Item',
  'Documents',
  'Other Materials',
] as const;

const LOCATION_LEVEL_OPTIONS = [
  'Ground Floor',
  'Level 1',
  'Level 2',
  'Level 3',
  'Level 4',
  'Level 5',
  'Canteen',
  'Library',
  'Others',
] as const;

const RETENTION_OPTIONS = [7, 14, 30, 60, 90] as const;

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getDisplayName(user: {
  username: string;
  firstName?: string | null;
  lastName?: string | null;
} | null) {
  if (!user) {
    return '';
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

const fieldClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-[14px] py-[10px] text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]';

export function LegacyAddItemForm() {
  const router = useRouter();
  const { user } = useAuth();
  const receivedBy = useMemo(() => getDisplayName(user), [user]);

  const [values, setValues] = useState({
    category: '',
    itemName: '',
    locationLevel: '',
    locationSpecific: '',
    dateReceived: formatToday(),
    retentionDays: '30',
    surrenderedBy: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!values.category) nextErrors.category = 'Item category is required.';
    if (!values.itemName.trim()) nextErrors.itemName = 'Item title is required.';
    if (!values.locationLevel) nextErrors.locationLevel = 'Level/Floor found is required.';
    if (!values.locationSpecific.trim()) nextErrors.locationSpecific = 'Specific place is required.';
    if (!values.dateReceived) nextErrors.dateReceived = 'Date received is required.';
    if (!values.retentionDays) nextErrors.retentionDays = 'Retention period is required.';
    if (!receivedBy) nextErrors.receivedBy = 'Waiting for logged-in user details.';
    if (!values.description.trim()) nextErrors.description = 'Item description is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const contactDetails = [
      values.surrenderedBy.trim() ? `Surrendered By: ${values.surrenderedBy.trim()}` : null,
      `Received By: ${receivedBy}`,
    ].filter(Boolean);

    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemName: values.itemName.trim(),
        category: values.category,
        location: `${values.locationLevel} - ${values.locationSpecific.trim()}`,
        dateReported: new Date(`${values.dateReceived}T00:00:00`).toISOString(),
        dueDate: addDays(values.dateReceived, Number(values.retentionDays)),
        description: values.description.trim(),
        contactInfo: contactDetails.join(' | '),
        imageUrl: '',
      }),
    });

    const data = await response.json().catch(() => ({ message: 'Unable to add the item.' }));
    setIsSubmitting(false);

    if (!response.ok) {
      setSubmitError(data.message ?? 'Unable to add the item.');
      window.alert(data.message ?? 'Unable to add the item.');
      return;
    }

    window.alert('Item added successfully.');
    router.push('/items');
    router.refresh();
  };

  return (
    <form
      className="rounded-[14px] border border-slate-200 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]"
      onSubmit={onSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Item Category" required error={errors.category}>
          <select
            className={fieldClassName}
            onChange={(event) => setValue('category', event.target.value)}
            value={values.category}
          >
            <option value="">Select category</option>
            {LEGACY_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Subcategory / Item Title"
          required
          description="The current Prisma schema requires itemName, so this field stores the subcategory or short item title."
          error={errors.itemName}
        >
          <input
            className={fieldClassName}
            onChange={(event) => setValue('itemName', event.target.value)}
            placeholder="e.g., Black Jansport backpack"
            value={values.itemName}
          />
        </Field>

        <Field label="Level/Floor Found" required error={errors.locationLevel}>
          <select
            className={fieldClassName}
            onChange={(event) => setValue('locationLevel', event.target.value)}
            value={values.locationLevel}
          >
            <option value="">Select level/floor</option>
            {LOCATION_LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Specific Place" required error={errors.locationSpecific}>
          <input
            className={fieldClassName}
            onChange={(event) => setValue('locationSpecific', event.target.value)}
            placeholder="e.g., Room 301, Library Desk 5"
            value={values.locationSpecific}
          />
        </Field>

        <Field label="Date Received" required error={errors.dateReceived}>
          <input
            className={fieldClassName}
            onChange={(event) => setValue('dateReceived', event.target.value)}
            type="date"
            value={values.dateReceived}
          />
        </Field>

        <Field label="Retention Period" required error={errors.retentionDays}>
          <select
            className={fieldClassName}
            onChange={(event) => setValue('retentionDays', event.target.value)}
            value={values.retentionDays}
          >
            {RETENTION_OPTIONS.map((days) => (
              <option key={days} value={String(days)}>
                {days} days
              </option>
            ))}
          </select>
        </Field>

        <Field label="Surrendered By" error={errors.surrenderedBy}>
          <input
            className={fieldClassName}
            onChange={(event) => setValue('surrenderedBy', event.target.value)}
            placeholder="Optional name or source"
            value={values.surrenderedBy}
          />
        </Field>

        <Field label="Received By" required error={errors.receivedBy}>
          <input
            className={`${fieldClassName} cursor-not-allowed opacity-80`}
            readOnly
            value={receivedBy || 'Loading...'}
          />
        </Field>

        <Field className="md:col-span-2" label="Item Description" required error={errors.description}>
          <textarea
            className={`${fieldClassName} min-h-[120px] resize-y`}
            onChange={(event) => setValue('description', event.target.value)}
            placeholder="Detailed description (color, brand, condition, features...)"
            rows={4}
            value={values.description}
          />
        </Field>
      </div>

      {submitError ? (
        <p className="mt-4 text-sm font-medium text-red-600">{submitError}</p>
      ) : null}

      <div className="mt-8 flex justify-end">
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Adding Item...' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  description,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
      {description ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
