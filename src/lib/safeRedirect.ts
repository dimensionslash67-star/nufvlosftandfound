const DEFAULT_REDIRECT = '/dashboard';

function decodeRedirect(value: string): string | null {
  let decoded = value;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    let next: string;

    try {
      next = decodeURIComponent(decoded);
    } catch {
      return null;
    }

    if (next === decoded) {
      return decoded;
    }

    decoded = next;
  }

  return null;
}

export function getSafeRedirect(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return DEFAULT_REDIRECT;
  }

  const decoded = decodeRedirect(value);

  if (
    decoded === null ||
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.startsWith('/\\') ||
    /[\\\s\u0000-\u001f\u007f-\u009f]/u.test(decoded) ||
    /^[a-z][a-z\d+.-]*:/iu.test(decoded)
  ) {
    return DEFAULT_REDIRECT;
  }

  return decoded;
}
