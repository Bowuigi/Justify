# TeX extractor

Extract TeX source (currently targets LaTeX and KaTeX) from [Justify](https://github.com/Bowuigi/Justify) System files (other formats might be supported in the future).

Given a system file it generates:

- A `\jyInfer{rulename}{rule name}{\\-separated premises}{conclusion}` rule that can be used to style content like an inference rule. Combine with the `jyRules` environment (in LaTeX) or separate rules with `\allowbreak \qquad` (in KaTeX and similar) to get a minimal variant of the `mathpartir` package for other uses.
- A `\jyDescription` macro that outputs the system's description wrapped in `\text{...}`.
- A `\jyGrammar` macro that outputs the system's grammar.
- A `\jg<category><constructor>` (both converted from `snake_case` to `PascalCase`) family of macros that correspond to each constructor. Use those for consistent styling across the document if required, at the cost of increased verbosity.
- A `\jr<relation>` (in `PascalCase`) family of macros that correspond to each relation. For consistent styling.
- A `\jrd<relation>` (in `PascalCase`) family of macros that showcases the relation and its description (good to increase first-time readability).
- A `\jrr<relation><rule>` (in `PascalCase`) family of macros that refer to a specific inference rule.
- A `\jrrs<relation>` family of macros that refer to every rule in a relation. Wrap inside the `jyRules` environment provided in `latex-compat.sty` to render those properly (centered, flexible spacing, vertical separation) in LaTeX. Use CSS to get a similar look in KaTeX.

## Usage

Assuming `deno run --allow-read --allow-env` is used to run Typescript (other runtimes like `bun` and `node` are supported)

```shell
deno run --allow-read --allow-env extractors/tex/main.ts <system file> > my/project/justify-tex.sty
```

This produces a file in `my/project/justify-<system name>.sty` which you can then use in LaTeX as such:

```latex
\documentclass{article}

% amsmath is required, amssymb is recommended
\usepackage{amsmath}
\usepackage{amssymb}
\input{justify-<system name>.sty}
% Only required for LaTeX. That file specifically is 0BSD so you can vendor it directly instead
\input{path/to/Justify/extractors/tex/latex-compat.sty}

\begin{document}

\section{Grammar}

\[ \jyGrammar \]

\section{Relations}

\[ \jrdSomeRelation \]

\begin{jyRules}
\jrrsSomeRelation
\end{jyRules}

\[ \jrdSomeOtherRelation \]

\begin{jyRules}
\jrrsSomeOtherRelation
\end{jyRules}

\section{Combining with other systems}

The \(\jrFoo{x}{y}{z}\) relation does not handle bar. The following rule change should integrate both:

\begin{jyRules}
  \jyInfer{Bar}{
    \jrFoo{x}{y}{z} \\
    \jrBar{x}{\sigma}
  }{ \jrFoo{x}{\sigma}{z} }
  \and
  \jyInfer{Zoo}{}{\jrBar{z}{z}}
\end{jyRules}

\end{document}
```

Auto-reloading can be setup using `entr` or similar programs.
