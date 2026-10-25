#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { default as process } from 'node:process';

import {
  type Diagnostic,
  queryFromJSONString,
  queryResultFromJSONString,
  type QueryResult,
  systemFromJSONString,
} from '@justify/core';
import { performQuery } from '@justify/inferencer';
import { runPipeline, type Extension } from '@justify/markdown-dsl';
import {
  metadataExtension,
  relationMetaExtension,
  relationRuleExtension,
  syntaxExtension,
} from '@justify/markdown-dsl/extensions';
import { extractTeX } from '@justify/tex-extractor';
import { validateQuery, validateQueryResult, validateSystem } from '@justify/validator';

import { prettySolution, renderReadError, renderUsageError, reportDiagnostics } from './render.ts';
import { styleErr, styleOut } from './style.ts';

function usageError(message: string, usage: string): number {
  console.error(renderUsageError(message, usage));
  return 1;
}

function wrongArgs(usage: string): number {
  return usageError('Wrong number of arguments.', usage);
}

function unknownCommand(command: string): number {
  return usageError(`Unknown command '${command}'.`, '{validate|infer|to-tex|from-markdown} ...');
}

function unknownFormat(format: string): number {
  return usageError(
    `Unknown format specifier '${format}'.`,
    'validate {system|query|query-result} filenames...',
  );
}

async function readInput(filename: string): Promise<string | null> {
  try {
    return await readFile(filename, { encoding: 'utf8' });
  } catch (error: unknown) {
    console.error(renderReadError(filename, error));
    return null;
  }
}

async function runValidateSystem(args: Array<string>): Promise<number> {
  if (args.length !== 1) {
    return wrongArgs('validate system <file>');
  }

  const filename = args[0]!;
  const contents = await readInput(filename);
  if (contents === null) {
    return 1;
  }

  const loaded = systemFromJSONString(filename, contents);
  const diagnostics = loaded.success ? validateSystem(loaded.value, filename) : loaded.diagnostics;

  if (reportDiagnostics(diagnostics)) {
    return 1;
  }
  console.log(styleOut('success', 'All good!'));
  return 0;
}

async function runValidateQuery(args: Array<string>): Promise<number> {
  if (args.length !== 2) {
    return wrongArgs('validate query <system-file> <query-file>');
  }

  const [systemFile, queryFile] = args as [string, string];
  const systemContents = await readInput(systemFile);
  const queryContents = await readInput(queryFile);
  if (systemContents === null || queryContents === null) {
    return 1;
  }

  const system = systemFromJSONString(systemFile, systemContents);
  const query = queryFromJSONString(queryFile, queryContents);
  if (!system.success || !query.success) {
    const diagnostics: Array<Diagnostic> = [
      ...(system.success ? [] : system.diagnostics),
      ...(query.success ? [] : query.diagnostics),
    ];
    reportDiagnostics(diagnostics);
    return 1;
  }

  if (reportDiagnostics(validateQuery(query.value, system.value, queryFile))) {
    return 1;
  }
  console.log(styleOut('success', 'All good!'));
  return 0;
}

async function runValidateQueryResult(args: Array<string>): Promise<number> {
  if (args.length !== 2) {
    return wrongArgs('validate query-result <system-file> <query-result-file>');
  }

  const [systemFile, queryResultFile] = args as [string, string];
  const systemContents = await readInput(systemFile);
  const queryResultContents = await readInput(queryResultFile);
  if (systemContents === null || queryResultContents === null) {
    return 1;
  }

  const system = systemFromJSONString(systemFile, systemContents);
  const queryResult = queryResultFromJSONString(queryResultFile, queryResultContents);
  if (!system.success || !queryResult.success) {
    const diagnostics: Array<Diagnostic> = [
      ...(system.success ? [] : system.diagnostics),
      ...(queryResult.success ? [] : queryResult.diagnostics),
    ];
    reportDiagnostics(diagnostics);
    return 1;
  }

  if (reportDiagnostics(validateQueryResult(queryResult.value, system.value, queryResultFile))) {
    return 1;
  }
  console.log(styleOut('success', 'All good!'));
  return 0;
}

async function runValidate(args: Array<string>): Promise<number> {
  const [format, ...rest] = args;
  switch (format) {
    case 'system': {
      const result = await runValidateSystem(rest);
      return result;
    }
    case 'query': {
      const result = await runValidateQuery(rest);
      return result;
    }
    case 'query-result': {
      const result = await runValidateQueryResult(rest);
      return result;
    }
    case undefined: {
      return wrongArgs('validate {system|query|query-result} filenames...');
    }
    default: {
      return unknownFormat(format);
    }
  }
}

interface InferArgs {
  machineReadable: boolean;
  systemFile: string;
  queryFile: string;
}

function parseInferArgs(args: Array<string>): InferArgs | null {
  if (args.length === 2) {
    return { machineReadable: false, systemFile: args[0]!, queryFile: args[1]! };
  }
  if (args.length === 3 && args[0] === '-m') {
    return { machineReadable: true, systemFile: args[1]!, queryFile: args[2]! };
  }
  return null;
}

async function runInfer(args: Array<string>): Promise<number> {
  const parsed = parseInferArgs(args);
  if (parsed === null) {
    return wrongArgs('infer [-m] <system-file> <query-file>');
  }

  const systemContents = await readInput(parsed.systemFile);
  const queryContents = await readInput(parsed.queryFile);
  if (systemContents === null || queryContents === null) {
    return 1;
  }

  const system = systemFromJSONString(parsed.systemFile, systemContents);
  const query = queryFromJSONString(parsed.queryFile, queryContents);
  if (!system.success || !query.success) {
    const diagnostics: Array<Diagnostic> = [
      ...(system.success ? [] : system.diagnostics),
      ...(query.success ? [] : query.diagnostics),
    ];
    reportDiagnostics(diagnostics);
    return 1;
  }

  const solutions = performQuery(system.value, query.value);
  if (typeof solutions === 'string') {
    console.error(styleErr('error', solutions));
    return 1;
  }

  const result: QueryResult = { solutions, count: solutions.length };
  if (parsed.machineReadable) {
    console.log(JSON.stringify(result));
  } else {
    console.log(solutions.map(solution => prettySolution(solution)).join('\n'));
  }
  return 0;
}

async function runToTex(args: Array<string>): Promise<number> {
  if (args.length !== 1) {
    return wrongArgs('to-tex <system-file>');
  }

  const filename = args[0]!;
  const contents = await readInput(filename);
  if (contents === null) {
    return 1;
  }

  const loaded = systemFromJSONString(filename, contents);
  if (!loaded.success) {
    reportDiagnostics(loaded.diagnostics);
    return 1;
  }

  console.log(extractTeX(loaded.value));
  return 0;
}

async function runFromMarkdown(args: Array<string>): Promise<number> {
  if (args.length !== 1) {
    return wrongArgs('from-markdown <file.jtf.md>');
  }

  const filename = args[0]!;
  const contents = await readInput(filename);
  if (contents === null) {
    return 1;
  }

  const extensions: Array<Extension> = [
    metadataExtension,
    syntaxExtension,
    relationMetaExtension,
    relationRuleExtension,
  ];
  const { extracted, diagnostics } = runPipeline(contents, filename, extensions);
  const hadDiagnostics = reportDiagnostics(diagnostics);

  console.log(JSON.stringify(extracted));
  return hadDiagnostics ? 1 : 0;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.toSpliced(0, 2);

  switch (command) {
    case 'validate': {
      process.exitCode = await runValidate(args);
      break;
    }
    case 'infer': {
      process.exitCode = await runInfer(args);
      break;
    }
    case 'to-tex': {
      process.exitCode = await runToTex(args);
      break;
    }
    case 'from-markdown': {
      process.exitCode = await runFromMarkdown(args);
      break;
    }
    case undefined: {
      process.exitCode = unknownCommand('');
      break;
    }
    default: {
      process.exitCode = unknownCommand(command);
    }
  }
}

await main();
