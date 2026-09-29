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
    if ('desc' in data) {
      ((data: unknown): void => {
        path.push('desc');
        if (!(typeof data === 'string')) {
          errors.push({
            path: [...path],
            message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
            suggestions: [],
          });
        }
        path.pop();
      })(data.desc);
    } else {
      errors.push({
        path: [...path],
        message: `missing required property "desc"`,
        suggestions: [],
      });
    }
    if ('suggest' in data) {
      ((data: unknown): void => {
        path.push('suggest');
        if (Array.isArray(data)) {
          for (const [key, value] of data.entries()) {
            path.push(key);
            const data = value;
            if (!(typeof data === 'string')) {
              errors.push({
                path: [...path],
                message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                suggestions: [],
              });
            }
            path.pop();
          }
        } else {
          errors.push({
            path: [...path],
            message: `expected array, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
            suggestions: [],
          });
        }
        path.pop();
      })(data.suggest);
    } else {
      errors.push({
        path: [...path],
        message: `missing required property "suggest"`,
        suggestions: [],
      });
    }
    if ('grammar' in data) {
      ((data: unknown): void => {
        path.push('grammar');
        if (Array.isArray(data)) {
          for (const [key, value] of data.entries()) {
            path.push(key);
            const data = value;
            if (
              typeof data === 'object' &&
              data !== null &&
              Object.getPrototypeOf(data) === Object.prototype
            ) {
              if ('name' in data) {
                ((data: unknown): void => {
                  path.push('name');
                  if (!(typeof data === 'string')) {
                    errors.push({
                      path: [...path],
                      message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                      suggestions: [],
                    });
                  }
                  path.pop();
                })(data.name);
              } else {
                errors.push({
                  path: [...path],
                  message: `missing required property "name"`,
                  suggestions: [],
                });
              }
              if ('desc' in data) {
                ((data: unknown): void => {
                  path.push('desc');
                  if (!(typeof data === 'string')) {
                    errors.push({
                      path: [...path],
                      message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                      suggestions: [],
                    });
                  }
                  path.pop();
                })(data.desc);
              } else {
                errors.push({
                  path: [...path],
                  message: `missing required property "desc"`,
                  suggestions: [],
                });
              }
              if ('is' in data) {
                ((data: unknown): void => {
                  path.push('is');
                  if (!(typeof data === 'string')) {
                    errors.push({
                      path: [...path],
                      message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                      suggestions: [],
                    });
                  }
                  path.pop();
                })(data.is);
              } else {
                errors.push({
                  path: [...path],
                  message: `missing required property "is"`,
                  suggestions: [],
                });
              }
              if ('where' in data) {
                ((data: unknown): void => {
                  path.push('where');
                  if (
                    typeof data === 'object' &&
                    data !== null &&
                    Object.getPrototypeOf(data) === Object.prototype
                  ) {
                    for (const [key, value] of Object.entries(data)) {
                      path.push(key);
                      const data = value;
                      if (typeof key === 'string') {
                        if (!(typeof data === 'string')) {
                          errors.push({
                            path: [...path],
                            message: `expected string, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                            suggestions: [],
                          });
                        }
                      } else {
                        errors.push({
                          path: [...path],
                          message: `expected string key, got ${key === null ? 'null' : typeof key}`,
                          suggestions: [],
                        });
                      }
                      path.pop();
                    }
                  } else {
                    errors.push({
                      path: [...path],
                      message: `expected JSON object, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
                      suggestions: [],
                    });
                  }
                  path.pop();
                })(data.where);
              }
              {
                /* properties */ const dataKeys = new Set(Object.keys(data));
                const allowedKeys = new Set(['name', 'desc', 'is', 'where']);
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
            path.pop();
          }
        } else {
          errors.push({
            path: [...path],
            message: `expected array, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
            suggestions: [],
          });
        }
        path.pop();
      })(data.grammar);
    } else {
      errors.push({
        path: [...path],
        message: `missing required property "grammar"`,
        suggestions: [],
      });
    }
    {
      /* properties */ const dataKeys = new Set(Object.keys(data));
      const allowedKeys = new Set(['desc', 'suggest', 'grammar']);
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
