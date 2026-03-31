'use client';

import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import type { SVGProps } from 'react';

const supportSteps = [
  'Open your GCash app and tap Scan.',
  'Scan the QR code shown above.',
  'Enter any amount you would like to send.',
  'Complete the transfer and save the receipt for your reference.',
];

export function CoffeeCupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M7 6.75h9.25a.75.75 0 0 1 .75.75v1.25h1a2.75 2.75 0 1 1 0 5.5h-1.16A5.25 5.25 0 0 1 11.75 18H9.5A4.5 4.5 0 0 1 5 13.5v-6a.75.75 0 0 1 .75-.75H7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17 9.75h1a1.75 1.75 0 0 1 0 3.5h-.84"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M8 3.75c-.83.9-.83 2.1 0 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M11.25 2.75c-.83.9-.83 2.1 0 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 3.75c-.83.9-.83 2.1 0 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path d="M4.75 20.25h14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function QrScanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M4.75 8.25v-2A1.5 1.5 0 0 1 6.25 4.75h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M19.25 8.25v-2a1.5 1.5 0 0 0-1.5-1.5h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M4.75 15.75v2a1.5 1.5 0 0 0 1.5 1.5h2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M19.25 15.75v2a1.5 1.5 0 0 1-1.5 1.5h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <rect height="4" rx="1" stroke="currentColor" strokeWidth="1.5" width="4" x="7" y="7" />
      <path d="M14 7h3v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path
        d="M17 13h-3v4h4v-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M8 14h3v3H8z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function SupportDeveloperModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <Dialog.Portal>
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

          <Dialog.Content className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
            <div className="flex justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 overflow-y-auto px-6 pb-8 pt-4">
              <div className="mb-1 flex items-center justify-center gap-2 text-gray-900">
                <CoffeeCupIcon className="h-7 w-7 text-amber-500" />
                <Dialog.Title className="text-center text-2xl font-bold">
                  Support the Developer
                </Dialog.Title>
              </div>

              <p className="mb-6 text-center text-xs text-gray-400">
                Keep the system alive and improving
              </p>

              <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
                <p className="text-base font-bold text-gray-900">Christopher Joseph Aureo</p>
                <p className="text-sm font-medium text-indigo-600">IT231</p>
                <p className="mt-1 text-xs text-gray-500">
                  Developer · NUFV Lost and Found System
                </p>
              </div>

              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-center text-sm leading-relaxed text-amber-800">
                  If you found this system helpful, consider buying me a coffee. Your
                  support helps maintain and improve the platform.
                </p>
              </div>

              <div className="mb-4 rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-center gap-2 text-center text-sm font-semibold text-gray-700">
                  <QrScanIcon className="h-5 w-5 text-emerald-600" />
                  <span>Scan to Support via GCash</span>
                </div>
                <div className="flex justify-center">
                  <Image
                    alt="GCash QR Code"
                    className="h-auto w-full max-w-[240px] rounded-xl shadow-md"
                    height={240}
                    priority
                    src="/images/gcash_qr.png"
                    width={240}
                  />
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  How to send support
                </p>
                {supportSteps.map((step, index) => (
                  <div className="flex items-start gap-3" key={step}>
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <CoffeeCupIcon className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Thank you so much for your support.
                  </span>
                </div>
              </div>

              <button
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
