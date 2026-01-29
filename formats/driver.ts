import { readFile } from 'node:fs/promises';
import betterAjvErrors from 'better-ajv-errors';

export async function parseFile<T>(schema: any, validator: any, filename: string): Promise<T|null> {
  const contents = await readFile(filename, { encoding: 'utf8' });
  let json: any = null;

  try {
    json = JSON.parse(contents);
  } catch (err: any) {
    console.error(`${filename}: JSON parsing error: ${err.message}`);
    return null;
  }

  const valid = validator(json);
  if (!valid) {
    console.error(betterAjvErrors(schema, json, validator.errors, {json: contents}));
    return null;
  } else {
    return json as T;
  }
}
