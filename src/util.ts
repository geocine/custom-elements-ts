export const toKebabCase = (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

export const toCamelCase = (str: string) => {
  return str
    .toLowerCase()
    .replace(/(\-\w)/g, (m: string) => m[1].toUpperCase());
};

export const toDotCase = (str: string) => {
  return str.replace(/(?!^)([A-Z])/g, ' $1')
    .replace(/[_\s]+(?=[a-zA-Z])/g, '.')
    .toLowerCase();
};

export const tryParseInt = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '') {
      const parsed = Number(trimmed);
      if (Number.isInteger(parsed) && String(parsed) === trimmed) {
        return parsed;
      }
    }
  }
  return value;
};