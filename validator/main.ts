import { parseQuery, parseSystem, Query, System } from "../formats/driver.ts";
import { default as process } from 'node:process';
import { validateSystem, validateQuery } from './driver.ts';

async function main() {
  if (process.argv.length < 3) {
    console.error(
      `Wrong number of arguments.\nUsage: ${
        process.argv[1]
      } {system|query|derivation-tree} filenames...`,
    );
    process.exitCode = 1;
    return;
  }

  const [_node, _source, format, ...rest] = process.argv;

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
    case "system": {
      if (rest.length !== 1) {
        console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} system filename`)
        process.exitCode = 1;
        return;
      }
      const system = await parseSystem(rest[0]);
      if (system === null) {
        process.exitCode = 1;
        return;
      }
      console.log(Deno.inspect(validateSystem(system)));
      break;
    }
    case "query": {
      if (rest.length !== 2) {
        console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} query system-filename query-filename`)
        process.exitCode = 1;
        return;
      }
      const system = await parseSystem(rest[0]);
      const query = await parseQuery(rest[1]);
      if (system === null || query === null) {
        process.exitCode = 1;
        return;
      }
      console.log(Deno.inspect(validateQuery(query, system)));
      break;
    }
    case "derivation-tree": {
      console.error("Derivation tree format not implemented.");
      process.exitCode = 1;
    }
    // every other case is unreachable
  }
}
main();
