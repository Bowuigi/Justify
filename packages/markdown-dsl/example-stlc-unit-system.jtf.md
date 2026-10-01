---
description: Simply-typed lambda calculus with a unit type
---

# Syntax

## Term

```jtf-syntax
desc: Terms
suggest: [e]
grammar:
  - name: variable
    desc: Variable $x$
    is: x
    where:
      x: literal
  - name: lambda
    desc: Bind the applied term of type $t$ to the variable $x$ in $e$
    is: '\lambda x : t . e'
    where:
      x: literal
      t: type as \tau
      e: term
  - name: apply
    desc: Applies $e_2$ to $e_1$, performing beta reduction
    is: e1 \; e2
    where:
      e1: term as e_1
      e2: term as e_2
  - name: star
    desc: The only term of type $\mathbf{1}$
    is: \star
```

## Type

```jtf-syntax
desc: Types
suggest: [A, B, \tau]
grammar:
  - name: arrow
    desc: A function from $A$ to $B$
    is: a \rightarrow b
    where:
      a: type as A
      b: type as B
  - name: unit
    desc: A type with only one inhabitant, $\star$
    is: \mathbf{1}
```

## Context

```jtf-syntax
desc: Contexts
suggest: [\Gamma]
grammar:
  - name: empty
    desc: Empty context, empty environment
    is: \cdot
  - name: extend
    desc: A cons operation for contexts (here, assoc lists)
    is: 'ctx , x : t'
    where:
      ctx: context as \Gamma
      x: literal
      t: type as \tau
```

# Relations

## Judge

```jtf-relation
desc: Term $e$ has type $\tau$ on context $\Gamma$
is: 'ctx \vdash tm : ty'
where:
  ctx: context as \Gamma
  tm: term as e
  ty: type as \tau
```

```jtf-rule
? e1 as e_1, e2 as e_2, a as A, b as B, ctx as \Gamma

judge ctx e1 (arrow a b)
judge ctx e2 a
------------------------- [App] app
judge ctx (apply e1 e2) b
```

```jtf-rule
? ctx as \Gamma, x, a as A, b as B, e

judge (extend ctx x a) e b
------------------------------------ [Lam] lam
judge ctx (lambda x a e) (arrow a b)
```

```jtf-rule
? ctx as \Gamma

----------------------- [Unit] unit
judge ctx (star) (unit)
```

```jtf-rule
? ctx as \Gamma, x, t as \tau

member x t ctx
-------------- [Var] var
judge ctx (variable x) t
```

## Member

```jtf-relation
desc: Identifier $x$ inside context $\Gamma$ has type $\tau$
is: 'x : t \in ctx'
where:
  x: literal
  t: type as \tau
  ctx: context as \Gamma
```

```jtf-rule
? x, t as \tau, ctx as \Gamma

--------------------------- [Found] found
member x t (extend ctx x t)
```

```jtf-rule
? x, y, t1 as \tau_1, t2 as \tau_2, ctx as \Gamma

member x t1 ctx
----------------------------- [Next] next
member x t1 (extend ctx y t2)
```
