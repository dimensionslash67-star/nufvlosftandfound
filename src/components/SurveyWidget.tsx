'use client';

import { useEffect, useRef, useState } from 'react';
import { SurveyPopupModal } from '@/components/SurveyPopupModal';
import { SurveySideButton } from '@/components/SurveySideButton';

const STORAGE_KEY = 'nufv-survey-popup-dismissed-until';
const SHOW_DELAY_MS = 2000;
const SUPPRESS_MS = 24 * 60 * 60 * 1000;
const SURVEY_URL = 'https://forms.office.com/r/ygdefNcTLn';

export function SurveyWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const autoTimerRef = useRef<number | null>(null);

  const clearAutoTimer = () => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  const dismissFor24Hours = () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + SUPPRESS_MS));
  };

  const closeAndRemember = () => {
    clearAutoTimer();
    dismissFor24Hours();
    setOpen(false);
  };

  const openSurvey = () => {
    clearAutoTimer();
    setOpen(true);
  };

  useEffect(() => {
    setMounted(true);

    const dismissedUntilRaw = window.localStorage.getItem(STORAGE_KEY);
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;

    if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) {
      return undefined;
    }

    autoTimerRef.current = window.setTimeout(() => {
      setOpen(true);
      autoTimerRef.current = null;
    }, SHOW_DELAY_MS);

    return () => {
      clearAutoTimer();
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SurveySideButton onClick={openSurvey} />

      <SurveyPopupModal
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            openSurvey();
            return;
          }

          closeAndRemember();
        }}
        onTakeSurvey={() => {
          window.open(SURVEY_URL, '_blank', 'noopener,noreferrer');
          closeAndRemember();
        }}
        open={open}
      />
    </>
  );
}
