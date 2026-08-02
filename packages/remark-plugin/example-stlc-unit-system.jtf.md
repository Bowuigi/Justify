---
title: Simply-typed lambda calculus with a unit type
---

# Syntax

## term

```justify-syntax
Terms

e ::=
  | x
    where
      x : literal
    name: variable
    doc: Variable $x$
  | \lambda x : t . e
    where
      x : literal x
      t as \tau : type
      e : term
    name: lambda
    doc: Bind the applied term of type $t$ to the variable $x$ in $e$
  | e1 \; e2
    where
      e1 as e_1 : term
      e2 as e_2 : term
    name: apply
    doc: Applies $e_2$ to $e_1$, performing beta reduction
  | \star
    name: star
    doc: The only term of type $\mathbf{1}$
```

## type

```justify-syntax
Types

\tau, A, B ::=
  | t1 \rightarrow t2
    where
      t1 as A : type
      t2 as B : type
    name: arrow
    doc: A function from $A$ to $B$
  | \mathbf{1}
    name: unit
    doc: A type with only one inhabitant, $\\star$
```

## context

```justify-syntax
\Gamma ::=
  | \cdot
    name: empty
    doc: Empty context, empty environment
  | ctx , x : t
    where
      ctx as \Gamma : context
      x : literal
      t as \tau : type
    name: extend
    doc: A cons operation for contexts (here, assoc lists)
```

# Relations

## judge

```justify-relation
Term $e$ has type $\\tau$ on context $\\Gamma$

ctx \vdash tm : ty
  ctx as \Gamma : context
  tm as e : term
  ty as \tau : type
```

```justify-rule
? e1 as e_1, e2 as e_2, a as A, b as B, ctx as \Gamma

judge ctx e1 (arrow a b)
judge ctx e2 a
------------------------- [App] app
judge ctx (apply e1 e2) b
```

```justify-rule
? ctx as \Gamma, x, a as A, b as B, e

judge (extend ctx x a) e b
------------------------------------ [Lam] lam
judge ctx (lambda x a e) (arrow a b)
```

```justify-rule
? ctx as \Gamma

----------------------- [Unit] unit
judge ctx (star) (unit)
```

```justify-rule
? ctx as \Gamma, x, t as \tau

member x t ctx
-------------- [Var] var
judge ctx (variable x) t
```

## member

```justify-relation
Identifier $x$ inside context $\\Gamma$ has type $\\tau$

ident : ty \in ctx
  ident as x : literal
  ty as \tau : type
  ctx as \Gamma : context
```

```justify-rule
? x, t as \tau, ctx as \Gamma

--------------------------- [Found] found
member x t (extend ctx x t)
```

```justify-rule
? x, y, t1 as \tau, t2 as \sigma, ctx as \Gamma

member x t1 ctx
----------------------------- [Next] next
member x t1 (extend ctx y t2)
```
