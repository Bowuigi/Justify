import { SSystem } from '../formats/system';
import { SQuery } from '../formats/query';
import { parseFile } from '../formats/common';

function checkSystem(system: SSystem) {
}

function checkQuery(query: SQuery) {
}

async function main() {
  if (process.argv.length !== 4) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} {system|query|derivation-tree} filename`);
    process.exit(1);
  }

  const [_node, _source, format, filename] = process.argv;

  if (!['system','query','derivation-tree'].includes(format)) {
    console.error(`Unknown format specifier '${format}'.\nUsage: ${process.argv[1]} {system|query|derivation-tree} filename`);
    process.exit(1);
  }

  switch (format) {
    case 'system':
      checkSystem(await parseFile(SSystem, 'system', filename));
      break;
    case 'query':
      checkQuery(await parseFile(SQuery, 'query', filename));
      break;
    case 'derivation-tree':
      console.error('Derivation tree format not implemented.');
      process.exit(1);
    // every other case is unreachable
  }
}
main();
