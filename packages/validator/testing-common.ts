import { default as assert } from 'node:assert';
import test from 'node:test';

import type { Query, System } from '@justify/core';

import { validateQuery, validateSystem } from './driver.ts';

export async function testSystem(
  name: string,
  system: System,
  expectedErrors: Array<Record<string, unknown>>,
): Promise<void> {
  await test(name, () => {
    const givenErrors = validateSystem(system);
    const completeExpectedErrors = givenErrors.map((gerr, ix) => ({
      ...gerr,
      ...expectedErrors[ix],
    }));
    assert.deepStrictEqual(givenErrors, completeExpectedErrors);
  });
}

export async function testQuery(
  name: string,
  system: System,
  query: Query,
  expectedErrors: Array<Record<string, unknown>>,
): Promise<void> {
  await test(name, () => {
    const shouldBeEmpty = validateSystem(system);
    assert.deepStrictEqual(shouldBeEmpty, []);
    const givenErrors = validateQuery(query, system);
    const completeExpectedErrors = givenErrors.map((gerr, ix) => ({
      ...gerr,
      ...expectedErrors[ix],
    }));
    assert.deepStrictEqual(givenErrors, completeExpectedErrors);
  });
}
