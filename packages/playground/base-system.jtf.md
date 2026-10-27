---
description: Starter System, natural numbers
---

# Syntax

## Number

Standard natural numbers defined by zero and a successor.

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
