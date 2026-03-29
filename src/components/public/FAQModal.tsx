'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const questions = [
  {
    question: 'How do I claim an item?',
    answer:
      'Find the matching item, note the item ID, then visit the Student Discipline Office with proof of ownership.',
  },
  {
    question: 'Can I reserve an item online?',
    answer:
      'No. Online browsing is for discovery only. Final verification and release happen in person at the office.',
  },
  {
    question: 'What proof do I need to bring?',
    answer:
      'Bring any identifying details you can provide, such as receipts, photos, unique marks, or a valid school ID.',
  },
  {
    question: 'How long are items kept before disposal?',
    answer:
      'Items are generally retained for 30 days unless school policy or the item category requires a different handling process.',
  },
  {
    question: 'Can someone else claim an item for me?',
    answer:
      'In most cases, the owner must appear in person. Exceptions are handled by the Student Discipline Office on a case-by-case basis.',
  },
  {
    question: 'Are claimed or disposed items shown publicly?',
    answer:
      'No. The public page shows only available pending items that are still open for verification and release.',
  },
  {
    question: 'Who do I contact for questions?',
    answer:
      'Contact the Student Discipline Office at sdo@nu-fairview.edu.ph during posted office hours.',
  },
];

export function FAQModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (entry) =>
          entry.question.toLowerCase().includes(search.toLowerCase()) ||
          entry.answer.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold text-slate-900">Frequently Asked Questions</Dialog.Title>
              <p className="mt-2 text-sm text-slate-500">
                Search for a question or browse the most common claim and office process topics.
              </p>
            </div>
            <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100">X</Dialog.Close>
          </div>

          <div className="mt-5">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search FAQ"
              type="search"
              value={search}
            />
          </div>

          <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {filteredQuestions.map((entry) => (
              <details key={entry.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer list-none font-semibold text-slate-900">
                  {entry.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{entry.answer}</p>
              </details>
            ))}

            {filteredQuestions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No FAQ entries match your search.
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
