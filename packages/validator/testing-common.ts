import { default as assert } from 'node:assert';
import test from 'node:test';
import { validateQuery, validateSystem } from './driver.ts';
import type { ModuleErrorInfo } from './module-common.ts';
import type { Query, System } from '../formats/driver.ts';

export function testSystem(name: string, system: System, expectedErrors: Array<Record<string, unknown>>) {
  test(name, () => {
    const givenErrors = validateSystem(system);
    const completeExpectedErrors = givenErrors.map((gerr, ix) => ({...gerr, ...expectedErrors[ix]}));
    assert.deepStrictEqual(givenErrors, completeExpectedErrors);
  });
}

export function testQuery(name: string, system: System, query: Query, expectedErrors: Array<Record<string, unknown>>) {
  test(name, () => {
    const shouldBeEmpty = validateSystem(system);
    assert.deepStrictEqual(shouldBeEmpty, []);
    const givenErrors = validateQuery(query, system);
    const completeExpectedErrors = givenErrors.map((gerr, ix) => ({...gerr, ...expectedErrors[ix]}));
    assert.deepStrictEqual(givenErrors, completeExpectedErrors);
  });
}
