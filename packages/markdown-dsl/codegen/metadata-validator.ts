type Path = Array<string | number>;
type Errors = Array<{ path: Path; message: string; suggestions: Array<string> }>;
export type ValidationResult = { success: true } | { success: false; errors: Errors };

export function validate(data: unknown): ValidationResult {
  const path: /* mutable */ Path = [];
  const errors: /* mutable */ Errors = [];

  validateMain(data, path, errors);

  if (errors.length > 0) {
    return { success: false, errors };
  }
  return { success: true };
}

function validateMain(data: unknown, path: Path, errors: Errors): void {
  if (
    typeof data === 'object' &&
    data !== null &&
    Object.getPrototypeOf(data) === Object.prototype
  ) {
    if ('description' in data) {
      ((data: unknown): void => {
        path.push('description');
        if (!(typeof data === 'string')) {
          errors.push({
            path: [...path],
            message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
            suggestions: [],
          });
        }
        path.pop();
      })(data.description);
    } else {
      errors.push({
        path: [...path],
        message: `missing required property "description"`,
        suggestions: [],
      });
    }
    {
      /* properties */ const dataKeys = new Set(Object.keys(data));
      const allowedKeys = new Set(['description']);
      const extraKeys = dataKeys.difference(allowedKeys);
      if (extraKeys.size > 0) {
        errors.push({
          path: [...path],
          message: `unexpected properties: "${[...extraKeys].map(x => x.toString()).join('", "')}"`,
          suggestions: [...allowedKeys],
        });
      }
    }
  } else {
    errors.push({
      path: [...path],
      message: `expected JSON object, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
      suggestions: [],
    });
  }
}
