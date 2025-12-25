import { AssocArray } from "./AssocArray";
import { type STerm } from "./format";

// Identifiers and tags are used for rendering, note that equal labels means equal number of args (as they point to global defs)
type Var = { kind: 'var', id: string, counter: number };
type Constructor = { kind: 'constructor', tag: string, args: Array<Term> };
type Identifier = { kind: 'identifier', id: string };
export type Term = Var | Constructor | Identifier;

type Substitution = AssocArray<Var, Term>;

type State = { subst: Substitution, counter: number };

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
    this.name = "OccursCheckFailedError";
    this.variable = variable;
    this.term = term;
    this.subst = subst;
  }
}

export function convertTerm(sterm: STerm, counter: number): [term: Term, newCounter: number] {
  if (typeof sterm === 'string') {
    return [{ kind: 'var', id: sterm, counter }, counter + 1];
  } if ('id' in sterm) { // Identifier
    return [{ kind: 'identifier', id: sterm.id }, counter];
  } if ('tag' in sterm) { // Constructor
    let prevCounter = counter;
    let newArgs: Array<Term> = [];
    for (const arg of sterm.args) {
      const [newSTerm, newCounter] = convertTerm(arg, prevCounter);
      newArgs.push(newSTerm);
      prevCounter = newCounter;
    }

    return [{ kind: 'constructor', tag: sterm.tag, args: newArgs }, prevCounter];
  }
  return sterm; // Silences ts-2366 only if sterm is never
}

// Throws if a variable is unbound in the pool
export function convertTermWithPool(sterm: STerm, pool: VarPool): Term {
  if (typeof sterm === 'string') {
    return pool[sterm];
  } if ('id' in sterm) {
    return { kind: 'identifier', id: sterm.id };
  } if ('tag' in sterm) {
    return {
      kind: 'constructor',
      tag: sterm.tag,
      args: sterm.args.map(a => convertTermWithPool(a, pool)),
    };
  }
  return sterm; // Silences ts-2366 only if sterm is never
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
  switch (term.kind) {
    case "var":
      return varEq(variable, term)
    case "constructor":
      return term.args.every(t => occursCheck(variable, walk(t, subst), subst));
    case "identifier":
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
  } if (termA.kind === 'identifier' && termB.kind === 'identifier') {
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
    case "nil":
      return streamB;
    case "delayed":
      // Swapped appendStream arguments to make disj fair
      return { kind: 'delayed', force: () => appendStream(streamB, streamA.force()) };
    case "cons":
      return { kind: 'cons', solution: streamA.solution, next: appendStream(streamA.next, streamB) };
  }
}

function appendMapStream(goal: Goal, stream: Stream): Stream {
  switch (stream.kind) {
    case "nil":
      return stream;
    case "delayed":
      return { kind: 'delayed', force: () => appendMapStream(goal, stream.force()) };
    case "cons":
      return appendStream(goal(stream.solution), appendMapStream(goal, stream.next));
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

    return block(pool)({ subst: st.subst, counter: count });
  };
}

// Use this for every relation you expect to be recursive
export function delay(goal: Goal): Goal {
  return (st: State) => {
    return { kind: 'delayed', force: () => goal(st) };
  }
}

export function run(solutions: number, goal: Goal): Array<State> {
  return takeStream(solutions, pullStream(goal({ subst: new AssocArray([]), counter: 0 })));
}

/// Constraints

export function eq(termA: Term, termB: Term): Goal {
  return (st: State) => {
    const newSubst = unify(walk(termA, st.subst), walk(termB, st.subst), st.subst);

    if (newSubst === null) return { kind: 'nil' };
    return { kind: 'cons', solution: { subst: newSubst, counter: st.counter }, next: { kind: 'nil' } };
  };
}

/// Relations and relation combinators

export function disj(goalA: Goal, goalB: Goal): Goal {
  return (st: State) => {
    return appendStream(goalA(st), goalB(st));
  };
}

export function conj(goalA: Goal, goalB: Goal): Goal {
  return (st: State) => {
    return appendMapStream(goalB, goalA(st));
  };
}
