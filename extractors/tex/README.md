# TeX extractor

Extract TeX source (currently targets LaTeX and KaTeX) from [Justify](https://github.com/Bowuigi/Justify) System files (other formats might be supported in the future).

Given a system file it generates:

- A `\jyDescription` macro that outputs the system's description wrapped in `\text{...}`.
- A `\jyGrammar` macro that outputs the system's grammar.
- A `\jg<category><constructor>` (both converted from `snake_case` to `PascalCase`) family of macros that correspond to each constructor. Use those for consistent styling across the document if required, at the cost of increased verbosity.
- A `\jr<relation>` (in `PascalCase`) family of macros that correspond to each relation. For consistent styling.
- A `\jrd<relation>` (in `PascalCase`) family of macros that showcases the relation and its description (good to increase first-time readability).
