---
title: Peano arithmetic / natural number arithmetic
---

# Syntax

## number

```justify-syntax
Natural number

n, m, k ::=
  | 0
    name: zero
    doc: Number zero
  | S n
    where
      n : number
    name: succ
    doc: Successor function, equivalent to $n \mapsto n+1$
```

# Relations

## equal

```justify-relation
Natural number $n$ is syntactically equal to $m$

n = m
  n : number
  m : number
```

```justify-rule
------------------- [Base] base
equal (zero) (zero)
```

```justify-rule
? x, y
equal x y
----------------------- [Ind] ind
equal (succ x) (succ y)
```

## add

```justify-relation
Natural number $n$ plus $m$ is syntactically equal to $k$.

n + m = k
  n : number
  m : number
  k : number
```

```justify-rule
? x
-------------- [Base] base
add x (zero) x
```

```justify-rule
? x, y, z

add x y z
----------------------- [Ind] ind
add x (succ y) (succ z)
```

## multiply

```justify-relation
Natural number $n$ times $m$ is syntactically equal to $k$.

n \times m = k
  n : number
  m : number
  k : number
```

```justify-rule
? x
------------------------ [Base] base
multiply x (zero) (zero)
```

```justify-rule
? w, x, y, z

multiply x y w
add w x z
--------------------- [Ind] ind
multiply x (succ y) z
```
