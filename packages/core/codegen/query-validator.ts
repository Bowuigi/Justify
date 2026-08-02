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
    if ('max_results' in data) {
      ((data: unknown): void => {
        path.push('max_results');
        if ((typeof data === 'number')) {
          if ((data >= 0 && data <= 65535)) {
            if (!Number.isInteger(data)) {
              errors.push({
                path: [...path],
                message: `value ${data} is not an unsigned integer`,
                suggestions: []
              });
            }
          } else {errors.push({
              path: [...path],
              message: `value ${data} out of range for uint16`,
              suggestions: []
            });}
        } else {errors.push({
            path: [...path],
            message: `expected uint16, got ${
              data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
            }`,
            suggestions: []
          });}
        path.pop();
      })(data.max_results);
    } else {errors.push({
        path: [...path],
        message: `missing required property "max_results"`,
        suggestions: []
      });}
    if ('variables' in data) {
      ((data: unknown): void => {
        path.push('variables');
        if (
          (typeof data === 'object' && data !== null &&
            Object.getPrototypeOf(data) === Object.prototype)
        ) {
          for (const [key, value] of Object.entries(data)) {
            path.push(key);
            const data = value;
            if ((typeof key === 'string')) validate_tex_math(data, path, errors);
            else {errors.push({
                path: [...path],
                message: `expected string key, got ${key === null ? 'null' : typeof key}`,
                suggestions: []
              });}
            path.pop();
          }
        } else {errors.push({
            path: [...path],
            message: `expected JSON object, got ${
              data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
            }`,
            suggestions: []
          });}
        path.pop();
      })(data.variables);
    } else {errors.push({
        path: [...path],
        message: `missing required property "variables"`,
        suggestions: []
      });}
    if ('literals' in data) {
      ((data: unknown): void => {
        path.push('literals');
        if (
          (typeof data === 'object' && data !== null &&
            Object.getPrototypeOf(data) === Object.prototype)
        ) {
          for (const [key, value] of Object.entries(data)) {
            path.push(key);
            const data = value;
            if ((typeof key === 'string')) validate_tex_math(data, path, errors);
            else {errors.push({
                path: [...path],
                message: `expected string key, got ${key === null ? 'null' : typeof key}`,
                suggestions: []
              });}
            path.pop();
          }
        } else {errors.push({
            path: [...path],
            message: `expected JSON object, got ${
              data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
            }`,
            suggestions: []
          });}
        path.pop();
      })(data.literals);
    } else {errors.push({
        path: [...path],
        message: `missing required property "literals"`,
        suggestions: []
      });}
    if ('args' in data) {
      ((data: unknown): void => {
        path.push('args');
        if ((Array.isArray(data))) {
          for (const [key, value] of data.entries()) {
            path.push(key);
            const data = value;
            validate_term(data, path, errors);
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
      const allowedKeys = new Set(['relation', 'max_results', 'variables', 'literals', 'args']);
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

function validate_tex_math(data: unknown, path: Path, errors: Errors): void {
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

function validate_term(data: unknown, path: Path, errors: Errors): void {
  if (
    (typeof data === 'object' && data !== null && Object.getPrototypeOf(data) === Object.prototype)
  ) {
    if ('is' in data) {
      ((data: unknown): void => {
        path.push('is');
        {
          /* enum */ const enum_ = ['con', 'ref'];
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
                  validate_term(data, path, errors);
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
        case 'ref': {
          if ('to' in data) {
            ((data: unknown): void => {
              path.push('to');
              validate_identifier(data, path, errors);
              path.pop();
            })(data.to);
          } else {errors.push({
              path: [...path],
              message: `missing required property "to"`,
              suggestions: []
            });}
          {
            /* properties */ const dataKeys = new Set(Object.keys(data));
            const allowedKeys = new Set(['to', 'is']);
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
        suggestions: ['con', 'ref']
      });}
  } else {errors.push({
      path: [...path],
      message: `expected JSON object, got ${
        data === null ? 'null' : (Array.isArray(data) ? 'array' : typeof data)
      }`,
      suggestions: []
    });}
}
