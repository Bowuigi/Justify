# Markdown extension

**WORK IN PROGRESS, NOT USABLE YET**

Generate [Justify](https://github.com/Bowuigi/Justify) files using a [remark](https://github.com/remarkjs/remark) extension.

See the examples for usage information.

# Why?

Any web editor idea I could come up with eventually became either a large system to edit pretty forms or _yet another editor_ for a few small custom formats. Both of those options take a long time to build and are annoying to work with if you need not-planned-for features (think literate code to put in your lang's documentation to get both docs and a reference implementation, literate blogs, a setup without web browsers, or a text-only editing experience).

This format is meant to:

- Focus mostly on presentation and easy integration
- Be easily readable in plain text
- Allow for simple extension support (here, as [unified](https://unifiedjs.com) passes that insert code blocks)
- Become modular and reusable
- Permit literate programming
- Allow for nice rendering
- Look less alien to LLMs and other AI technologies
- Leverage larger ecosystems to simplify implementation
