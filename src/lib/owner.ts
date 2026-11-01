export const OWNER_PIN_SETTING_KEY = 'owner_console_pin_hash';
export const OWNER_PIN_SESSION_VERSION_KEY = 'owner_pin_session_version';
export const OWNER_PIN_COOKIE_NAME = 'owner-pin-token';
export const OWNER_PIN_MAX_AGE = 60 * 60 * 4;
export const OWNER_EMAIL_SETTING_KEY = 'owner_user_email';

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? '';
}
