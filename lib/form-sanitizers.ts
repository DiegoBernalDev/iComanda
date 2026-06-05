const TEXT_ONLY_REGEX = /[^\p{L}\s.,;:()'"-]/gu;

export function sanitizeIntegerInput(value: string) {
  return value.replace(/\D+/g, '');
}

export function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [integerPart = '', ...decimalParts] = normalized.split('.');

  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join('')}`;
}

export function sanitizePhoneInput(value: string) {
  return sanitizeIntegerInput(value);
}

export function sanitizeSlugInput(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function sanitizeTextOnlyInput(value: string) {
  return value.replace(TEXT_ONLY_REGEX, '');
}
