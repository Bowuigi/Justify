---
description: Peano arithmetic / natural number arithmetic
---

# Syntax

## Number

```jtf-syntax
desc: Natural number
suggest: [n, m, k]
grammar:
  - name: zero
    desc: Number zero
    is: '0'
  - name: succ
    desc: Successor function, equivalent to $n \mapsto n+1$
    is: S n
    where:
      n: number
```

# Relations

## Equal

```jtf-relation
desc: Natural number $n$ is syntactically equal to $m$
is: n = m
where:
  n: number
  m: number
```

```jtf-rule
------------------- [Base] base
equal (zero) (zero)
```

```jtf-rule
? x, y
equal x y
----------------------- [Ind] ind
equal (succ x) (succ y)
```

## Add

```jtf-relation
desc: Natural number $n$ plus $m$ is syntactically equal to $k$
is: n + m = k
where:
  n: number
  m: number
  k: number
```

```jtf-rule
? x

-------------- [Base] base
add x (zero) x
```

```jtf-rule
? x, y, z

add x y z
----------------------- [Ind] ind
add x (succ y) (succ z)
```

## Multiply

```jtf-relation
desc: Natural number $n$ times $m$ is syntactically equal to $k$
is: n \times m = k
where:
  n: number
  m: number
  k: number
```

```jtf-rule
? x
------------------------ [Base] base
multiply x (zero) (zero)
```

```jtf-rule
? w, x, y, z

multiply x y w
add w x z
--------------------- [Ind] ind
multiply x (succ y) z
```
