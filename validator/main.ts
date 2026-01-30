import { parseQuery, parseSystem, Query, System } from "../formats/driver.ts";
import { default as process } from "node:process";

function checkSystem(system: System) {
}

function checkQuery(query: Query) {
}

async function main() {
  if (process.argv.length !== 4) {
    console.error(
      `Wrong number of arguments.\nUsage: ${
        process.argv[1]
      } {system|query|derivation-tree} filename`,
    );
    process.exitCode = 1;
    return;
  }

  const [_node, _source, format, filename] = process.argv;

  if (!["system", "query", "derivation-tree"].includes(format)) {
    console.error(
      `Unknown format specifier '${format}'.\nUsage: ${
        process.argv[1]
      } {system|query|derivation-tree} filename`,
    );
    process.exitCode = 1;
    return;
  }

  switch (format) {
    case "system":
      const system = await parseSystem(filename);
      if (system === null) {
        process.exitCode = 1;
        return;
      }
      checkSystem(system);
      break;
    case "query":
      const query = await parseQuery(filename);
      if (query === null) {
        process.exitCode = 1;
        return;
      }
      checkQuery(query);
      break;
    case "derivation-tree":
      console.error("Derivation tree format not implemented.");
      process.exitCode = 1;
      // every other case is unreachable
  }
}
main();
