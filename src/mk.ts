/*
  MicroKanren implementation with the following augments:
  - Simple-complete search
  - N-ary conj, disj and fresh by default
  - fresh supports identifiers for variables
  - Occurs check
  - Literal values
  - Checked variables and literals
  - STerm conversions
  - Codegen for SSystem / inference rules (check src/mkCodegen.ts)
  - Derivation tree generation (WIP)
  - Idempotent substitution transformation
*/
import { AssocArray } from "./AssocArray";
import { type STerm } from "../formats/common";

// Identifiers and tags are used for rendering, note that equal labels means equal number of args (as they point to global defs)
type Var = { kind: 'var', id: string, counter: number };
type Constructor = { kind: 'constructor', tag: string, args: Array<Term> };
type Literal = { kind: 'literal', id: string };
export type Term = Var | Constructor | Literal;

type Substitution = AssocArray<Var, Term>;

export type RuleLog = { rule: string, relation: string, args: Array<Term>, premises: Array<RuleLog> };
type State = { subst: Substitution, log: Array<RuleLog>, counter: number };

type ImmatureStream = { kind: 'delayed', force: () => Stream };
type MatureStream = { kind: 'nil' } | { kind: 'cons', solution: State, next: Stream };
type Stream = MatureStream | ImmatureStream;

export type Goal = (st: State) => Stream;

type VarPool = Record<string, Var>;

class OcurrsCheckFailedError extends Error {
  public variable: Var;
  public term: Term;
  public subst: Substitution;

  constructor(variable: Var, term: Term, subst: Substitution) {
    super(`Occurs check failed for variable ${variable.id}@${variable.counter}`);
    this.name = 'OccursCheckFailedError';
    this.variable = variable;
    this.term = term;
    this.subst = subst;
  }
}

class UnboundIdentifierError extends Error {
  public variable: string;
  public variableList: Array<string>;
  public literalList: Array<string>;

  constructor(variable: string, variableList: Array<string>, literalList: Array<string>) {
    super(`Unbound identifier '${variable}', not a bound variable or literal`);
    this.name = 'UnboundIdentifierError';
    this.variable = variable;
    this.variableList = variableList;
    this.literalList = literalList;
  }
}

// TODO: Should this be used? convertTermWithPool + fresh is more fitting in most cases
export function convertTerm(sterm: STerm, variables: Array<string>, literals: Array<string>, counter: number): [term: Term, newCounter: number] {
  if (typeof sterm === 'string') {
    if (variables.includes(sterm)) {
      return [{ kind: 'var', id: sterm, counter }, counter + 1];
    } else if (literals.includes(sterm)) {
      return [{ kind: 'literal', id: sterm }, counter];
    } else {
      throw new UnboundIdentifierError(sterm, variables, literals);
    }
  } else { // Constructor
    let prevCounter = counter;
    let newArgs: Array<Term> = [];
    for (const arg of sterm.args) {
      const [newSTerm, newCounter] = convertTerm(arg, variables, literals, prevCounter);
      newArgs.push(newSTerm);
      prevCounter = newCounter;
    }
    return [{ kind: 'constructor', tag: sterm.tag, args: newArgs }, prevCounter];
  }
}

export function convertTermWithPool(sterm: STerm, pool: VarPool, literals: Array<string>): Term {
  if (typeof sterm === 'string') {
    if (literals.includes(sterm)) {
      return { kind: 'literal', id: sterm };
    } else if (pool[sterm] !== undefined) {
      return pool[sterm];
    } else {
      throw new UnboundIdentifierError(sterm, Object.keys(pool), literals);
    }
  } else { // Constructor
    return {
      kind: 'constructor',
      tag: sterm.tag,
      args: sterm.args.map(a => convertTermWithPool(a, pool, literals)),
    };
  }
}

function varEq(a: Var, b: Var): boolean {
  return a.counter === b.counter && a.id === b.id;
}

function walk(term: Term, subst: Substitution): Term {
  if (term.kind === 'var') {
    const stepped = subst.lastKey(varN => varEq(term, varN));
    if (stepped === null) return term;
    return walk(stepped, subst);
  } else {
    return term;
  }
}

// Returns true if the substitution has recursive bindings
function occursCheck(variable: Var, term: Term, subst: Substitution): boolean {
  const steppedTerm = walk(term, subst);
  switch (steppedTerm.kind) {
    case 'var':
      return varEq(variable, steppedTerm);
    case 'constructor':
      return steppedTerm.args.some(t => occursCheck(variable, t, subst));
    case 'literal':
      return false;
  }
}

function extendSubstitution(variable: Var, term: Term, subst: Substitution): Substitution {
  if (occursCheck(variable, term, subst)) {
    throw new OcurrsCheckFailedError(variable, term, subst);
  }
  return subst.insert(variable, term);
}

function unify(termA: Term, termB: Term, subst: Substitution): Substitution | null {
  if (termA.kind === 'var' && termB.kind === 'var' && varEq(termA, termB)) {
    return subst;
  } if (termA.kind === 'var') {
    return extendSubstitution(termA, termB, subst);
  } if (termB.kind === 'var') {
    return extendSubstitution(termB, termA, subst);
  } if (termA.kind === 'literal' && termB.kind === 'literal') {
    return (termA.id === termB.id) ? subst : null;
  } if (termA.kind === 'constructor' && termB.kind === 'constructor' && termA.tag === termB.tag) {
    return unifyArray(termA.args, termB.args, subst);
  }
  return null;
}

function unifyArray(termsA: Array<Term>, termsB: Array<Term>, subst: Substitution): Substitution | null {
  let oldSubst = subst;
  for (const [ix, term] of termsA.entries()) {
    let newSubst = unify(walk(term, oldSubst), walk(termsB[ix], oldSubst), oldSubst);
    if (newSubst === null) return null;
    oldSubst = newSubst;
  }
  return oldSubst;
}

function appendStream(streamA: Stream, streamB: Stream): Stream {
  switch (streamA.kind) {
    case 'nil':
      return streamB;
    case 'delayed':
      // Swapped appendStream arguments to make disj fair
      return { kind: 'delayed', force: () => appendStream(streamB, streamA.force()) };
    case 'cons':
      return { kind: 'cons', solution: streamA.solution, next: appendStream(streamA.next, streamB) };
  }
}

function appendMapStream(goal: Goal, stream: Stream): Stream {
  switch (stream.kind) {
    case 'nil':
      return stream;
    case 'delayed':
      return { kind: 'delayed', force: () => appendMapStream(goal, stream.force()) };
    case 'cons':
      return appendStream(goal(stream.solution), appendMapStream(goal, stream.next));
  }
}

function mapStream(stream: Stream, fn: (st: State) => State): Stream {
  switch (stream.kind) {
    case 'nil':
      return stream;
    case 'delayed':
      return { kind: 'delayed', force: () => mapStream(stream.force(), fn) }
    case 'cons':
      return { kind: 'cons', solution: fn(stream.solution), next: mapStream(stream.next, fn) };
  }
}

function pullStream(stream: Stream): MatureStream {
  if (stream.kind === 'delayed') {
    return pullStream(stream.force());
  }
  return stream;
}

function takeStream(solutions: number, stream: MatureStream): Array<State> {
  if (stream.kind === 'nil' || solutions <= 0) {
    return [];
  }
  if (solutions === 1) {
    return [stream.solution];
  }
  return [stream.solution].concat(takeStream(solutions - 1, pullStream(stream.next)));
}

//// Presentation

function walkAll(term: Term, subst: Substitution): Term {
  const stepped = walk(term, subst);

  switch (stepped.kind) {
    case 'constructor':
      return {
        kind: stepped.kind,
        tag: stepped.tag,
        args: stepped.args.map(a => walkAll(a, subst)),
      };
    case 'var':
      return stepped;
    case 'literal':
      return stepped;
  }
}

export function toIdempotent(subst: Substitution): Substitution {
  return new AssocArray(
    subst.data.map(v => ({ key: v.key, value: walkAll(v.value, subst) }))
  );
}

// The substitution should be idempotent for efficiency
export function walkLog(log: RuleLog, subst: Substitution): RuleLog {
  return {
    rule: log.rule,
    relation: log.relation,
    args: log.args.map(a => walkAll(a, subst)),
    premises: log.premises.map(p => walkLog(p, subst))
  };
}

//// DSL primitives

/// State management

export function fresh(ids: Array<string>, block: (pool: VarPool) => Goal): Goal {
  return (st: State) => {
    let pool: VarPool = {};
    let count = st.counter;
    for (const id of ids) {
      pool[id] = { kind: 'var', id, counter: count };
      count++;
    }

    return block(pool)({ subst: st.subst, log: st.log, counter: count });
  };
}

export function wrapLogs(rule: string, relation: string, args: Array<Term>, goal: Goal) {
  return (st: State) => {
    return mapStream(goal(st), sol =>
      ({ ...sol, log: [{ rule, relation, args, premises: sol.log }] })
    );
  }
}

// Use this for every relation you expect to be recursive
export function delay(goal: Goal): Goal {
  return (st: State) => {
    return { kind: 'delayed', force: () => goal(st) };
  }
}

export function run(solutions: number, goal: Goal): Array<State> {
  return takeStream(solutions, pullStream(goal({ subst: new AssocArray([]), log: [], counter: 0 })));
}

/// Constraints

export function eq(termA: Term, termB: Term): Goal {
  return (st: State) => {
    const newSubst = unify(walk(termA, st.subst), walk(termB, st.subst), st.subst);

    if (newSubst === null) return { kind: 'nil' };
    return { kind: 'cons', solution: { subst: newSubst, log: st.log, counter: st.counter }, next: { kind: 'nil' } };
  };
}

/// Relations and relation combinators

export function disjN(...goals: Array<Goal>): Goal {
  return goals.reduceRight((prev, cur) =>
    (st: State) => appendStream(cur(st), prev(st))
  );
}

export function conjN(...goals: Array<Goal>): Goal {
  return goals.reduceRight((prev, cur) =>
    (st: State) => appendMapStream(prev, cur(st))
  );
}
