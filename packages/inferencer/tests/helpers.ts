import type { Term } from '../mk.ts';

export type VariableTerm = Extract<Term, { is: 'var' }>;
export type LiteralTerm = Extract<Term, { is: 'lit' }>;
export type ConstructorTerm = Extract<Term, { is: 'con' }>;

export function var_(id: string, counter: number): VariableTerm {
  return { is: 'var', id, counter };
}

export function lit(id: string): LiteralTerm {
  return { is: 'lit', id };
}

export function con(from: string, tag: string, args: Array<Term>): ConstructorTerm {
  return { is: 'con', from, tag, args };
}
