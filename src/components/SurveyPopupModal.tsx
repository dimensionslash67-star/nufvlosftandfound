'use client';

import * as Dialog from '@radix-ui/react-dialog';

const SURVEY_URL = 'https://forms.office.com/r/ygdefNcTLn';

export function SurveyPopupModal({
  open,
  onOpenChange,
  onTakeSurvey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTakeSurvey: () => void;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="survey-popup-overlay" />
        <Dialog.Content className="survey-popup-content max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-white sm:text-xl">
              We&apos;d love your feedback!
            </Dialog.Title>

            <Dialog.Close asChild>
              <button
                aria-label="Close survey popup"
                className="rounded-full p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                type="button"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </Dialog.Close>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Help us improve the NU Fairview Lost and Found system by answering a short satisfaction survey.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              onClick={onTakeSurvey}
              type="button"
            >
              Answer Satisfaction Survey
            </button>

            <Dialog.Close asChild>
              <button
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                type="button"
              >
                Maybe Later
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const SURVEY_POPUP_URL = SURVEY_URL;
