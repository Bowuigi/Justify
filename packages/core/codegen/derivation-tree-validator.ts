type Path = Array<string | number>;
type Errors = Array<{ path: Path, message: string, suggestions: Array<string> }>;
export type ValidationResult = { success: true } | { success: false, errors: Errors };

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
  if ((Array.isArray(data))) {
    for (const [key, value] of data.entries()) {
      path.push(key);
      const data = value;
      validate_derivation(data, path, errors);
      path.pop();
    }
  } else {errors.push({
      path: [...path],
      message: `expected array, got ${
        data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
      }`,
      suggestions: []
    });}
}

function validate_identifier(data: unknown, path: Path, errors: Errors): void {
  if (!(typeof data === 'string')) {
    errors.push({
      path: [...path],
      message: `expected string, got ${
        data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
      }`,
      suggestions: []
    });
  }
}

function validate_derivation_term(data: unknown, path: Path, errors: Errors): void {
  if (
    (typeof data === 'object' && data !== null && Object.getPrototypeOf(data) === Object.prototype)
  ) {
    if ('is' in data) {
      ((data: unknown): void => {
        path.push('is');
        {
          /* enum */ const enum_ = ['con', 'lit', 'var'];
          if ((typeof data === 'string')) {
            if (!enum_.includes(data)) {
              errors.push({ path: [...path], message: `unexpected "${data}"`, suggestions: enum_ });
            }
          } else {errors.push({
              path: [...path],
              message: `unexpected ${
                data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
              }`,
              suggestions: enum_
            });}
        }
        path.pop();
      })(data.is);
      switch (data.is) {
        case 'con': {
          if ('from' in data) {
            ((data: unknown): void => {
              path.push('from');
              validate_identifier(data, path, errors);
              path.pop();
            })(data.from);
          } else {errors.push({
              path: [...path],
              message: `missing required property "from"`,
              suggestions: []
            });}
          if ('tag' in data) {
            ((data: unknown): void => {
              path.push('tag');
              validate_identifier(data, path, errors);
              path.pop();
            })(data.tag);
          } else {errors.push({
              path: [...path],
              message: `missing required property "tag"`,
              suggestions: []
            });}
          if ('args' in data) {
            ((data: unknown): void => {
              path.push('args');
              if ((Array.isArray(data))) {
                for (const [key, value] of data.entries()) {
                  path.push(key);
                  const data = value;
                  validate_derivation_term(data, path, errors);
                  path.pop();
                }
              } else {errors.push({
                  path: [...path],
                  message: `expected array, got ${
                    data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
                  }`,
                  suggestions: []
                });}
              path.pop();
            })(data.args);
          } else {errors.push({
              path: [...path],
              message: `missing required property "args"`,
              suggestions: []
            });}
          {
            /* properties */ const dataKeys = new Set(Object.keys(data));
            const allowedKeys = new Set(['from', 'tag', 'args', 'is']);
            const extraKeys = dataKeys.difference(allowedKeys);
            if ((extraKeys.size > 0)) {
              errors.push({
                path: [...path],
                message: `unexpected properties: "${
                  [...extraKeys].map((x) => x.toString()).join('", "')
                }"`,
                suggestions: [...allowedKeys]
              });
            }
          }
          break;
        }
        case 'lit': {
          if ('id' in data) {
            ((data: unknown): void => {
              path.push('id');
              validate_identifier(data, path, errors);
              path.pop();
            })(data.id);
          } else {errors.push({
              path: [...path],
              message: `missing required property "id"`,
              suggestions: []
            });}
          {
            /* properties */ const dataKeys = new Set(Object.keys(data));
            const allowedKeys = new Set(['id', 'is']);
            const extraKeys = dataKeys.difference(allowedKeys);
            if ((extraKeys.size > 0)) {
              errors.push({
                path: [...path],
                message: `unexpected properties: "${
                  [...extraKeys].map((x) => x.toString()).join('", "')
                }"`,
                suggestions: [...allowedKeys]
              });
            }
          }
          break;
        }
        case 'var': {
          if ('id' in data) {
            ((data: unknown): void => {
              path.push('id');
              validate_identifier(data, path, errors);
              path.pop();
            })(data.id);
          } else {errors.push({
              path: [...path],
              message: `missing required property "id"`,
              suggestions: []
            });}
          if ('counter' in data) {
            ((data: unknown): void => {
              path.push('counter');
              if ((typeof data === 'number')) {
                if ((data >= 0 && data <= 4294967295)) {
                  if (!Number.isInteger(data)) {
                    errors.push({
                      path: [...path],
                      message: `value ${data} is not an unsigned integer`,
                      suggestions: []
                    });
                  }
                } else {errors.push({
                    path: [...path],
                    message: `value ${data} out of range for uint32`,
                    suggestions: []
                  });}
              } else {errors.push({
                  path: [...path],
                  message: `expected uint32, got ${
                    data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
                  }`,
                  suggestions: []
                });}
              path.pop();
            })(data.counter);
          } else {errors.push({
              path: [...path],
              message: `missing required property "counter"`,
              suggestions: []
            });}
          {
            /* properties */ const dataKeys = new Set(Object.keys(data));
            const allowedKeys = new Set(['id', 'counter', 'is']);
            const extraKeys = dataKeys.difference(allowedKeys);
            if ((extraKeys.size > 0)) {
              errors.push({
                path: [...path],
                message: `unexpected properties: "${
                  [...extraKeys].map((x) => x.toString()).join('", "')
                }"`,
                suggestions: [...allowedKeys]
              });
            }
          }
          break;
        }
      }
    } else {errors.push({
        path: [...path],
        message: `missing discriminator "is"`,
        suggestions: ['con', 'lit', 'var']
      });}
  } else {errors.push({
      path: [...path],
      message: `expected JSON object, got ${
        data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
      }`,
      suggestions: []
    });}
}

function validate_derivation(data: unknown, path: Path, errors: Errors): void {
  if (
    (typeof data === 'object' && data !== null && Object.getPrototypeOf(data) === Object.prototype)
  ) {
    if ('relation' in data) {
      ((data: unknown): void => {
        path.push('relation');
        validate_identifier(data, path, errors);
        path.pop();
      })(data.relation);
    } else {errors.push({
        path: [...path],
        message: `missing required property "relation"`,
        suggestions: []
      });}
    if ('rule' in data) {
      ((data: unknown): void => {
        path.push('rule');
        validate_identifier(data, path, errors);
        path.pop();
      })(data.rule);
    } else {errors.push({
        path: [...path],
        message: `missing required property "rule"`,
        suggestions: []
      });}
    if ('args' in data) {
      ((data: unknown): void => {
        path.push('args');
        if ((Array.isArray(data))) {
          for (const [key, value] of data.entries()) {
            path.push(key);
            const data = value;
            validate_derivation_term(data, path, errors);
            path.pop();
          }
        } else {errors.push({
            path: [...path],
            message: `expected array, got ${
              data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
            }`,
            suggestions: []
          });}
        path.pop();
      })(data.args);
    } else {errors.push({
        path: [...path],
        message: `missing required property "args"`,
        suggestions: []
      });}
    if ('premises' in data) {
      ((data: unknown): void => {
        path.push('premises');
        if ((Array.isArray(data))) {
          for (const [key, value] of data.entries()) {
            path.push(key);
            const data = value;
            validate_derivation(data, path, errors);
            path.pop();
          }
        } else {errors.push({
            path: [...path],
            message: `expected array, got ${
              data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
            }`,
            suggestions: []
          });}
        path.pop();
      })(data.premises);
    } else {errors.push({
        path: [...path],
        message: `missing required property "premises"`,
        suggestions: []
      });}
    {
      /* properties */ const dataKeys = new Set(Object.keys(data));
      const allowedKeys = new Set(['relation', 'rule', 'args', 'premises']);
      const extraKeys = dataKeys.difference(allowedKeys);
      if ((extraKeys.size > 0)) {
        errors.push({
          path: [...path],
          message: `unexpected properties: "${
            [...extraKeys].map((x) => x.toString()).join('", "')
          }"`,
          suggestions: [...allowedKeys]
        });
      }
    }
  } else {errors.push({
      path: [...path],
      message: `expected JSON object, got ${
        data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
      }`,
      suggestions: []
    });}
}
