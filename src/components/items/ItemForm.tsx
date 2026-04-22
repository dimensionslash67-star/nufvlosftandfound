'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { DeleteItemModal } from '@/components/items/DeleteItemModal';
import { Toast } from '@/components/ui/Toast';
import { ITEM_CATEGORIES } from '@/lib/constants';
import { itemSchema } from '@/lib/validations';
import type { Item } from '@/types/item';
import { ImageUpload } from './ImageUpload';

type ItemFormValues = z.infer<typeof itemSchema>;

export function ItemForm({
  canDelete = false,
  item,
  mode,
}: {
  canDelete?: boolean;
  item?: Partial<Item>;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemName: item?.itemName ?? '',
      description: item?.description ?? '',
      category: (item?.category as ItemFormValues['category']) ?? ITEM_CATEGORIES[0],
      location: item?.location ?? '',
      contactInfo: item?.contactInfo ?? '',
      imageUrl: item?.imageUrl ?? '',
    },
  });

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    },
    [],
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const response = await fetch(mode === 'create' ? '/api/items' : `/api/items/${item?.id}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({ message: 'Unable to save the item.' }));

    if (!response.ok) {
      setSubmitError(data.message ?? 'Unable to save the item.');
      return;
    }

    const nextItemId = data.item?.id ?? item?.id;
    router.push(nextItemId ? `/items/${nextItemId}` : '/items');
    router.refresh();
  });

  const handleDelete = async () => {
    if (!item?.id) {
      return;
    }

    setDeleteError(null);
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'X-Delete-Source': 'EDIT_PAGE',
        },
      });
      const data = await response.json().catch(() => ({ message: 'Unable to delete the item.' }));

      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to delete the item.');
      }

      setDeleteModalOpen(false);
      setToast({
        variant: 'success',
        message: 'Item deleted successfully. Redirecting to the items list...',
      });

      redirectTimeoutRef.current = window.setTimeout(() => {
        router.push('/items');
        router.refresh();
      }, 900);
    } catch (error) {
      console.error('Delete item from edit page error:', error);
      const message = error instanceof Error ? error.message : 'Unable to delete the item.';
      setDeleteError(message);
      setToast({
        variant: 'error',
        message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteModalChange = (open: boolean) => {
    setDeleteModalOpen(open);

    if (!open) {
      setDeleteError(null);
    }
  };

  const deleteModalItem =
    mode === 'edit' && item?.id && item.itemName && item.reporterId
      ? {
          id: item.id,
          itemCode: item.itemCode ?? null,
          itemName: item.itemName,
          reporterId: item.reporterId,
          reporter: item.reporter,
        }
      : null;

  return (
    <>
      <form
        className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] md:p-8"
        onSubmit={onSubmit}
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="itemName">
                Item Name
              </label>
              <input
                id="itemName"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                placeholder="Black umbrella with curved handle"
                {...register('itemName')}
              />
              {errors.itemName ? (
                <p className="text-sm text-red-600">{errors.itemName.message}</p>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                  {...register('category')}
                >
                  {ITEM_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="location">
                  Location Found
                </label>
                <input
                  id="location"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                  placeholder="Main lobby near registrar"
                  {...register('location')}
                />
                {errors.location ? (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                placeholder="Describe the item clearly so claimants can verify ownership."
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="contactInfo">
                Contact Information
              </label>
              <input
                id="contactInfo"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                placeholder="Office extension, mobile number, or email"
                {...register('contactInfo')}
              />
              {errors.contactInfo ? (
                <p className="text-sm text-red-600">{errors.contactInfo.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Item Image</label>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload value={field.value || null} onChange={(value) => field.onChange(value ?? '')} />
              )}
            />
            {errors.imageUrl ? <p className="text-sm text-red-600">{errors.imageUrl.message}</p> : null}
          </div>
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy/90 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Saving item...'
                : 'Updating item...'
              : mode === 'create'
                ? 'Save Found Item'
                : 'Update Item'}
          </button>
        </div>

        {mode === 'edit' && item?.id && canDelete ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">
                  Danger Zone
                </p>
                <p className="mt-2 text-sm text-red-700">
                  Deleting this item will permanently remove it from the system. This action cannot be undone.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(true)}
                type="button"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        ) : null}
      </form>

      {deleteModalItem ? (
        <DeleteItemModal
          error={deleteError}
          item={deleteModalItem}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onOpenChange={handleDeleteModalChange}
          open={deleteModalOpen}
        />
      ) : null}

      {toast ? (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
          variant={toast.variant}
        />
      ) : null}
    </>
  );
}
