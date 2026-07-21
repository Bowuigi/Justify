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
    if ('description' in data) {
      ((data: unknown): void => {
        path.push('description');
        validate_tex_text(data, path, errors);
        path.pop();
      })(data.description);
    } else {errors.push({
        path: [...path],
        message: `missing required property "description"`,
        suggestions: []
      });}
    if ('syntax' in data) {
      ((data: unknown): void => {
        path.push('syntax');
        if (
          (typeof data === 'object' && data !== null &&
            Object.getPrototypeOf(data) === Object.prototype)
        ) {
          for (const [key, value] of Object.entries(data)) {
            path.push(key);
            const data = value;
            if ((typeof key === 'string')) {
              if (
                (typeof data === 'object' && data !== null &&
                  Object.getPrototypeOf(data) === Object.prototype)
              ) {
                if ('description' in data) {
                  ((data: unknown): void => {
                    path.push('description');
                    validate_tex_text(data, path, errors);
                    path.pop();
                  })(data.description);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "description"`,
                    suggestions: []
                  });}
                if ('suggestions' in data) {
                  ((data: unknown): void => {
                    path.push('suggestions');
                    if ((Array.isArray(data))) {
                      for (const [key, value] of data.entries()) {
                        path.push(key);
                        const data = value;
                        validate_tex_math(data, path, errors);
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
                  })(data.suggestions);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "suggestions"`,
                    suggestions: []
                  });}
                if ('grammar' in data) {
                  ((data: unknown): void => {
                    path.push('grammar');
                    if ((Array.isArray(data))) {
                      for (const [key, value] of data.entries()) {
                        path.push(key);
                        const data = value;
                        if (
                          (typeof data === 'object' && data !== null &&
                            Object.getPrototypeOf(data) === Object.prototype)
                        ) {
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
                          if ('description' in data) {
                            ((data: unknown): void => {
                              path.push('description');
                              validate_tex_text(data, path, errors);
                              path.pop();
                            })(data.description);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "description"`,
                              suggestions: []
                            });}
                          if ('tex_parts' in data) {
                            ((data: unknown): void => {
                              path.push('tex_parts');
                              validate_tex_math_parts(data, path, errors);
                              path.pop();
                            })(data.tex_parts);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "tex_parts"`,
                              suggestions: []
                            });}
                          if ('fixity' in data) {
                            ((data: unknown): void => {
                              path.push('fixity');
                              validate_fixity(data, path, errors);
                              path.pop();
                            })(data.fixity);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "fixity"`,
                              suggestions: []
                            });}
                          if ('arguments' in data) {
                            ((data: unknown): void => {
                              path.push('arguments');
                              validate_arguments(data, path, errors);
                              path.pop();
                            })(data.arguments);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "arguments"`,
                              suggestions: []
                            });}
                          {
                            /* properties */ const dataKeys = new Set(Object.keys(data));
                            const allowedKeys = new Set([
                              'id',
                              'description',
                              'tex_parts',
                              'fixity',
                              'arguments'
                            ]);
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
                  })(data.grammar);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "grammar"`,
                    suggestions: []
                  });}
                {
                  /* properties */ const dataKeys = new Set(Object.keys(data));
                  const allowedKeys = new Set(['description', 'suggestions', 'grammar']);
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
            } else {errors.push({
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
      })(data.syntax);
    } else {errors.push({
        path: [...path],
        message: `missing required property "syntax"`,
        suggestions: []
      });}
    if ('relations' in data) {
      ((data: unknown): void => {
        path.push('relations');
        if (
          (typeof data === 'object' && data !== null &&
            Object.getPrototypeOf(data) === Object.prototype)
        ) {
          for (const [key, value] of Object.entries(data)) {
            path.push(key);
            const data = value;
            if ((typeof key === 'string')) {
              if (
                (typeof data === 'object' && data !== null &&
                  Object.getPrototypeOf(data) === Object.prototype)
              ) {
                if ('description' in data) {
                  ((data: unknown): void => {
                    path.push('description');
                    validate_tex_text(data, path, errors);
                    path.pop();
                  })(data.description);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "description"`,
                    suggestions: []
                  });}
                if ('tex_parts' in data) {
                  ((data: unknown): void => {
                    path.push('tex_parts');
                    validate_tex_math_parts(data, path, errors);
                    path.pop();
                  })(data.tex_parts);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "tex_parts"`,
                    suggestions: []
                  });}
                if ('fixity' in data) {
                  ((data: unknown): void => {
                    path.push('fixity');
                    validate_fixity(data, path, errors);
                    path.pop();
                  })(data.fixity);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "fixity"`,
                    suggestions: []
                  });}
                if ('arguments' in data) {
                  ((data: unknown): void => {
                    path.push('arguments');
                    validate_arguments(data, path, errors);
                    path.pop();
                  })(data.arguments);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "arguments"`,
                    suggestions: []
                  });}
                if ('rules' in data) {
                  ((data: unknown): void => {
                    path.push('rules');
                    if ((Array.isArray(data))) {
                      for (const [key, value] of data.entries()) {
                        path.push(key);
                        const data = value;
                        if (
                          (typeof data === 'object' && data !== null &&
                            Object.getPrototypeOf(data) === Object.prototype)
                        ) {
                          if ('rule' in data) {
                            ((data: unknown): void => {
                              path.push('rule');
                              if (
                                (typeof data === 'object' && data !== null &&
                                  Object.getPrototypeOf(data) === Object.prototype)
                              ) {
                                if ('tex' in data) {
                                  ((data: unknown): void => {
                                    path.push('tex');
                                    validate_tex_text(data, path, errors);
                                    path.pop();
                                  })(data.tex);
                                } else {errors.push({
                                    path: [...path],
                                    message: `missing required property "tex"`,
                                    suggestions: []
                                  });}
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
                                  const allowedKeys = new Set(['tex', 'id']);
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
                                    data === null
                                      ? 'null'
                                      : (Array.isArray(data) ? 'array' : typeof data)
                                  }`,
                                  suggestions: []
                                });}
                              path.pop();
                            })(data.rule);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "rule"`,
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
                                  if ((typeof key === 'string')) {
                                    validate_tex_math(data, path, errors);
                                  } else {errors.push({
                                      path: [...path],
                                      message: `expected string key, got ${
                                        key === null ? 'null' : typeof key
                                      }`,
                                      suggestions: []
                                    });}
                                  path.pop();
                                }
                              } else {errors.push({
                                  path: [...path],
                                  message: `expected JSON object, got ${
                                    data === null
                                      ? 'null'
                                      : (Array.isArray(data) ? 'array' : typeof data)
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
                                  if ((typeof key === 'string')) {
                                    validate_tex_math(data, path, errors);
                                  } else {errors.push({
                                      path: [...path],
                                      message: `expected string key, got ${
                                        key === null ? 'null' : typeof key
                                      }`,
                                      suggestions: []
                                    });}
                                  path.pop();
                                }
                              } else {errors.push({
                                  path: [...path],
                                  message: `expected JSON object, got ${
                                    data === null
                                      ? 'null'
                                      : (Array.isArray(data) ? 'array' : typeof data)
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
                          if ('patterns' in data) {
                            ((data: unknown): void => {
                              path.push('patterns');
                              if (
                                (typeof data === 'object' && data !== null &&
                                  Object.getPrototypeOf(data) === Object.prototype)
                              ) {
                                for (const [key, value] of Object.entries(data)) {
                                  path.push(key);
                                  const data = value;
                                  if ((typeof key === 'string')) {
                                    validate_term(data, path, errors);
                                  } else {errors.push({
                                      path: [...path],
                                      message: `expected string key, got ${
                                        key === null ? 'null' : typeof key
                                      }`,
                                      suggestions: []
                                    });}
                                  path.pop();
                                }
                              } else {errors.push({
                                  path: [...path],
                                  message: `expected JSON object, got ${
                                    data === null
                                      ? 'null'
                                      : (Array.isArray(data) ? 'array' : typeof data)
                                  }`,
                                  suggestions: []
                                });}
                              path.pop();
                            })(data.patterns);
                          } else {errors.push({
                              path: [...path],
                              message: `missing required property "patterns"`,
                              suggestions: []
                            });}
                          if ('premises' in data) {
                            ((data: unknown): void => {
                              path.push('premises');
                              if ((Array.isArray(data))) {
                                for (const [key, value] of data.entries()) {
                                  path.push(key);
                                  const data = value;
                                  if (
                                    (typeof data === 'object' && data !== null &&
                                      Object.getPrototypeOf(data) === Object.prototype)
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
                                              data === null
                                                ? 'null'
                                                : (Array.isArray(data) ? 'array' : typeof data)
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
                                      const allowedKeys = new Set(['relation', 'args']);
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
                                        data === null
                                          ? 'null'
                                          : (Array.isArray(data) ? 'array' : typeof data)
                                      }`,
                                      suggestions: []
                                    });}
                                  path.pop();
                                }
                              } else {errors.push({
                                  path: [...path],
                                  message: `expected array, got ${
                                    data === null
                                      ? 'null'
                                      : (Array.isArray(data) ? 'array' : typeof data)
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
                            const allowedKeys = new Set([
                              'rule',
                              'variables',
                              'literals',
                              'patterns',
                              'premises'
                            ]);
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
                  })(data.rules);
                } else {errors.push({
                    path: [...path],
                    message: `missing required property "rules"`,
                    suggestions: []
                  });}
                {
                  /* properties */ const dataKeys = new Set(Object.keys(data));
                  const allowedKeys = new Set([
                    'description',
                    'tex_parts',
                    'fixity',
                    'arguments',
                    'rules'
                  ]);
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
            } else {errors.push({
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
      })(data.relations);
    } else {errors.push({
        path: [...path],
        message: `missing required property "relations"`,
        suggestions: []
      });}
    {
      /* properties */ const dataKeys = new Set(Object.keys(data));
      const allowedKeys = new Set(['description', 'syntax', 'relations']);
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

function validate_fixity(data: unknown, path: Path, errors: Errors): void {
  {
    /* enum */ const enum_ = ['infix', 'prefix', 'postfix', 'none'];
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

function validate_tex_text(data: unknown, path: Path, errors: Errors): void {
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

function validate_tex_math_parts(data: unknown, path: Path, errors: Errors): void {
  if ((Array.isArray(data))) {
    for (const [key, value] of data.entries()) {
      path.push(key);
      const data = value;
      validate_tex_math(data, path, errors);
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

function validate_arguments(data: unknown, path: Path, errors: Errors): void {
  if ((Array.isArray(data))) {
    for (const [key, value] of data.entries()) {
      path.push(key);
      const data = value;
      if (
        (typeof data === 'object' && data !== null &&
          Object.getPrototypeOf(data) === Object.prototype)
      ) {
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
        if ('tex' in data) {
          ((data: unknown): void => {
            path.push('tex');
            validate_tex_math(data, path, errors);
            path.pop();
          })(data.tex);
        } else {errors.push({
            path: [...path],
            message: `missing required property "tex"`,
            suggestions: []
          });}
        {
          /* properties */ const dataKeys = new Set(Object.keys(data));
          const allowedKeys = new Set(['from', 'id', 'tex']);
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
