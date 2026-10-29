import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

type Responsibility =
  | 'domain'
  | 'application-use-case'
  | 'application-port'
  | 'inbound-adapter'
  | 'outbound-adapter'
  | 'presentation-localization'
  | 'composition'
  | 'service-worker';

interface RuntimeModule {
  path: string;
  responsibility: Responsibility;
  rationale?: string;
  rules?: string[];
  isolatedTests?: string[];
}

interface Dependency {
  specifier: string;
  kind: 'import' | 'type-only-import' | 're-export' | 'type-only-re-export' | 'dynamic-import' | 'import-type';
  line: number;
  column: number;
}

const repositoryRoot = resolve(__dirname, '../../..');
const srcRoot = resolve(repositoryRoot, 'frontend/src');
const manifestPath = resolve(repositoryRoot, 'frontend/tests/architecture/modules.json');
const projectFiles = collectProjectFiles(repositoryRoot);
const externalPackages = readExternalPackages();

function collectProjectFiles(root: string): Set<string> {
  const result = new Set<string>();

  function visit(directory: string): void {
    for (const name of readdirSync(directory)) {
      if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
      const path = join(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else result.add(normalize(path));
    }
  }

  visit(root);
  return result;
}

function readExternalPackages(): Set<string> {
  const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {})
  ]);
}

function sourceModules(): string[] {
  return [...projectFiles]
    .filter((path) => path.startsWith(`${srcRoot}/`) && /\.(?:tsx?|jsx?|mts|cts)$/.test(path) && !path.endsWith('.d.ts'))
    .map(relativePath)
    .sort();
}

function relativePath(path: string): string {
  return normalize(path).slice(repositoryRoot.length + 1).replaceAll('\\', '/');
}

function getDependencies(filePath: string, source: string): Dependency[] {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const dependencies: Dependency[] = [];
  const add = (specifier: ts.Expression | undefined, kind: Dependency['kind']) => {
    if (!specifier || !ts.isStringLiteralLike(specifier)) return;
    const position = sourceFile.getLineAndCharacterOfPosition(specifier.getStart(sourceFile));
    dependencies.push({
      specifier: specifier.text,
      kind,
      line: position.line + 1,
      column: position.character + 1
    });
  };

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const typeOnly = Boolean(clause?.isTypeOnly)
        || Boolean(clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
          && clause.namedBindings.elements.length > 0
          && clause.namedBindings.elements.every((element) => element.isTypeOnly));
      add(node.moduleSpecifier, typeOnly ? 'type-only-import' : 'import');
    } else if (ts.isExportDeclaration(node)) {
      add(node.moduleSpecifier, node.isTypeOnly ? 'type-only-re-export' : 're-export');
    }
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      add(node.arguments[0], 'dynamic-import');
    } else if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      add(ts.isLiteralTypeNode(argument) ? argument.literal : undefined, 'import-type');
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return dependencies;
}

function resolveLocalImport(from: string, specifier: string, knownFiles: Set<string>): string | undefined {
  const cleanSpecifier = specifier.split('?')[0];
  let base: string;
  if (cleanSpecifier.startsWith('@/')) {
    base = resolve(repositoryRoot, 'frontend/src', cleanSpecifier.slice(2));
  } else if (cleanSpecifier.startsWith('.')) {
    base = resolve(dirname(from), cleanSpecifier);
  } else {
    return undefined;
  }

  const candidates = [
    base,
    ...['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.json', '.css'].map((extension) => `${base}${extension}`),
    ...['.ts', '.tsx', '.js', '.jsx'].map((extension) => join(base, `index${extension}`))
  ];
  return candidates.map(normalize).find((candidate) => knownFiles.has(candidate));
}

function importDiagnostic(
  from: string,
  dependency: Dependency,
  knownFiles: Set<string>
): string | undefined {
  const fromPath = resolve(repositoryRoot, from);
  const cleanSpecifier = dependency.specifier.split('?')[0];
  if (cleanSpecifier.startsWith('virtual:') || cleanSpecifier.startsWith('node:')) return undefined;
  const localTarget = resolveLocalImport(fromPath, cleanSpecifier, knownFiles);
  if (localTarget) return undefined;
  if (cleanSpecifier.startsWith('.') || cleanSpecifier.startsWith('@/')) {
    return `${from}:${dependency.line}:${dependency.column} unresolved ${dependency.kind} "${dependency.specifier}"`;
  }
  const packageName = cleanSpecifier.startsWith('@')
    ? cleanSpecifier.split('/').slice(0, 2).join('/')
    : cleanSpecifier.split('/')[0];
  if (!externalPackages.has(packageName)) {
    return `${from}:${dependency.line}:${dependency.column} undeclared external dependency "${dependency.specifier}"`;
  }
  return undefined;
}

function layerViolation(source: RuntimeModule, target: RuntimeModule): boolean {
  const inward = new Set<Responsibility>(['domain', 'application-use-case', 'application-port']);
  switch (source.responsibility) {
    case 'domain':
      return target.responsibility !== 'domain';
    case 'application-use-case':
      return !inward.has(target.responsibility);
    case 'application-port':
      return target.responsibility !== 'domain' && target.responsibility !== 'application-port';
    case 'outbound-adapter':
      return target.responsibility === 'inbound-adapter'
        || target.responsibility === 'presentation-localization'
        || target.responsibility === 'composition'
        || target.responsibility === 'service-worker';
    case 'inbound-adapter':
      return target.responsibility === 'outbound-adapter'
        || target.responsibility === 'composition'
        || target.responsibility === 'service-worker';
    case 'presentation-localization':
      return target.responsibility === 'outbound-adapter'
        || target.responsibility === 'composition'
        || target.responsibility === 'service-worker';
    case 'service-worker':
      return target.responsibility !== 'service-worker' && target.responsibility !== 'outbound-adapter';
    case 'composition':
      return false;
  }
}

function browserGlobalDiagnostics(filePath: string, source: string): string[] {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const forbidden = new Set([
    'window', 'document', 'navigator', 'localStorage', 'sessionStorage',
    'indexedDB', 'caches', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker',
    'HTMLElement', 'HTMLCanvasElement', 'Element', 'Node', 'Window', 'Navigator',
    'AbortSignal', 'Storage', 'Document', 'Event', 'KeyboardEvent', 'CustomEvent',
    'globalThis', 'self', 'process', 'console', 'setTimeout', 'setInterval',
    'clearTimeout', 'clearInterval'
  ]);
  const diagnostics: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node) && forbidden.has(node.text)) {
      const parent = node.parent;
      const isPropertyName = (ts.isPropertyAccessExpression(parent) && parent.name === node)
        || (ts.isPropertyAssignment(parent) && parent.name === node)
        || ((ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node);
      if (!isPropertyName) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        diagnostics.push(`${filePath}:${position.line + 1}:${position.character + 1} forbidden browser/I/O global "${node.text}"`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return diagnostics;
}

function architectureDiagnostics(
  sources: Map<string, string>,
  modules: RuntimeModule[],
  knownFiles: Set<string>,
  root = repositoryRoot
): string[] {
  const diagnostics: string[] = [];
  const sourcePaths = [...sources.keys()].sort();
  const manifestPaths = modules.map(({ path }) => path).sort();
  const validResponsibilities = new Set([
    'domain', 'application-use-case', 'application-port', 'inbound-adapter',
    'outbound-adapter', 'presentation-localization', 'composition', 'service-worker'
  ]);
  const inwardResponsibilities = new Set<Responsibility>([
    'domain', 'application-use-case', 'application-port'
  ]);
  const portsPath = 'frontend/src/application/ports.ts';
  const portSource = sources.get(portsPath);
  const repositoryOperations = portSource ? scheduleRepositoryOperations(portSource) : new Set<string>();
  if (portSource && repositoryOperations.size === 0) {
    diagnostics.push(`${portsPath} does not declare ScheduleRepositoryV5 repository operations`);
  }
  for (const path of sourcePaths.filter((source) => !manifestPaths.includes(source))) {
    diagnostics.push(`unclassified source module ${path}`);
  }
  for (const path of manifestPaths.filter((entry) => !sourcePaths.includes(entry))) {
    diagnostics.push(`stale manifest entry ${path}`);
  }

  const modulesByPath = new Map(modules.map((module) => [module.path, module]));
  for (const [filePath, source] of sources) {
    const module = modulesByPath.get(filePath);
    if (!module) continue;
    if (!validResponsibilities.has(module.responsibility)) {
      diagnostics.push(`${filePath} has invalid responsibility "${module.responsibility}"`);
    }
    if (
      ['composition', 'service-worker', 'presentation-localization'].includes(module.responsibility)
      && !module.rationale?.trim()
    ) {
      diagnostics.push(`${filePath} responsibility "${module.responsibility}" requires a rationale`);
    }
    if ((module.responsibility === 'domain' || module.responsibility.startsWith('application-'))) {
      diagnostics.push(...browserGlobalDiagnostics(filePath, source));
    }
    if (module.responsibility === 'composition') {
      diagnostics.push(...compositionDiagnostics(filePath, source, repositoryOperations));
    }
    for (const dependency of getDependencies(filePath, source)) {
      const resolution = resolveLocalImport(resolve(root, filePath), dependency.specifier, knownFiles);
      const targetPath = resolution && relativePath(resolution);
      const targetModule = targetPath && modulesByPath.get(targetPath);
      if (
        inwardResponsibilities.has(module.responsibility)
        && !targetModule
        && (resolution !== undefined || (!dependency.specifier.startsWith('.') && !dependency.specifier.startsWith('@/')))
      ) {
        diagnostics.push(
          `${filePath}:${dependency.line}:${dependency.column} prohibited ${dependency.kind} dependency outside domain/application`
        );
        continue;
      }
      if (resolution && sources.has(targetPath ?? '')) {
        if (!targetModule) continue;
        if (layerViolation(module, targetModule)) {
          diagnostics.push(
            `${filePath}:${dependency.line}:${dependency.column} prohibited ${dependency.kind} edge to ${targetPath}`
          );
        }
      } else {
        const diagnostic = importDiagnostic(filePath, dependency, knownFiles);
        if (diagnostic) diagnostics.push(diagnostic);
      }
    }
    for (const rule of module.rules ?? []) {
      const tests = module.isolatedTests ?? [];
      if (tests.length === 0) {
        diagnostics.push(`${filePath} rule "${rule}" has no isolated test mapping`);
        continue;
      }
      const mapped = tests.some((testPath) => {
        if (!testPath.startsWith('frontend/tests/unit/')) return false;
        const testFile = resolve(root, testPath);
        if (!knownFiles.has(normalize(testFile))) return false;
        const testSource = readFileSync(testFile, 'utf8');
        return getDependencies(testPath, testSource).some((dependency) => {
          const target = resolveLocalImport(testFile, dependency.specifier, knownFiles);
          return target !== undefined && relativePath(target) === filePath;
        });
      });
      if (!mapped) diagnostics.push(`${filePath} rule "${rule}" has no test importing its module`);
    }
  }
  return diagnostics;
}

function scheduleRepositoryOperations(source: string): Set<string> {
  const sourceFile = ts.createSourceFile('ports.ts', source, ts.ScriptTarget.Latest, true);
  const scheduleRepository = sourceFile.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) && statement.name.text === 'ScheduleRepositoryV5'
  );
  return new Set((scheduleRepository?.members ?? []).flatMap((member) => (
    ts.isMethodSignature(member) && (ts.isIdentifier(member.name) || ts.isStringLiteralLike(member.name))
      ? [member.name.text]
      : []
  )));
}

function compositionDiagnostics(filePath: string, source: string, repositoryOperations: Set<string>): string[] {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const diagnostics: string[] = [];

  function report(name: string, node: ts.Node): void {
    if (repositoryOperations.has(name)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      diagnostics.push(
        `${filePath}:${position.line + 1}:${position.character + 1} composition directly references application repository port "${name}"`
      );
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isPropertyAccessExpression(node)) {
      report(node.name.text, node.name);
    } else if (ts.isElementAccessExpression(node) && node.argumentExpression
      && ts.isStringLiteralLike(node.argumentExpression)) {
      report(node.argumentExpression.text, node.argumentExpression);
    } else if (ts.isBindingElement(node)) {
      const property = node.propertyName ?? node.name;
      if (ts.isIdentifier(property) || ts.isStringLiteralLike(property)) report(property.text, property);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return diagnostics;
}

function readArchitectureManifest(): RuntimeModule[] {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as RuntimeModule[];
}

describe('hexagonal architecture inventory', () => {
  it('classifies every maintained runtime source exactly once and has no stale entries', () => {
    const manifest = readArchitectureManifest();
    const sourcePaths = sourceModules();
    const manifestPaths = manifest.map(({ path }) => path);
    expect(manifestPaths, 'manifest paths must be unique').toHaveLength(new Set(manifestPaths).size);
    expect(manifestPaths.sort()).toEqual(sourcePaths);
  });

  it('reports an unclassified source module and a stale manifest entry', () => {
    const diagnostics = architectureDiagnostics(
      new Map([['frontend/src/domain/known.ts', 'export const known = true;'], ['frontend/src/domain/new.ts', '']]),
      [
        { path: 'frontend/src/domain/known.ts', responsibility: 'domain' },
        { path: 'frontend/src/domain/removed.ts', responsibility: 'domain' }
      ],
      new Set()
    );
    expect(diagnostics).toContain('unclassified source module frontend/src/domain/new.ts');
    expect(diagnostics).toContain('stale manifest entry frontend/src/domain/removed.ts');
  });

  it('reports missing and invalid isolated-test mappings for declared rules', () => {
    const sourcePath = 'frontend/src/domain/rule.ts';
    const source = new Map([[sourcePath, 'export const applyRule = () => true;']]);
    const knownFiles = new Set([resolve(repositoryRoot, sourcePath)]);
    const missingMapping = architectureDiagnostics(source, [{
      path: sourcePath,
      responsibility: 'domain',
      rules: ['apply rule'],
      isolatedTests: []
    }], knownFiles);
    const invalidMapping = architectureDiagnostics(source, [{
      path: sourcePath,
      responsibility: 'domain',
      rules: ['apply rule'],
      isolatedTests: ['frontend/tests/unit/not-a-real-test.test.ts']
    }], knownFiles);

    expect(missingMapping).toContain(`${sourcePath} rule "apply rule" has no isolated test mapping`);
    expect(invalidMapping).toContain(`${sourcePath} rule "apply rule" has no test importing its module`);
  });

  it('extracts alias, re-export, type-only and literal dynamic-import dependencies', () => {
    const file = 'frontend/src/domain/example.ts';
    const files = new Set([
      resolve(repositoryRoot, file),
      resolve(repositoryRoot, 'frontend/src/domain/types.ts'),
      resolve(repositoryRoot, 'frontend/src/domain/other.ts'),
      resolve(repositoryRoot, 'frontend/src/domain/lazy.ts'),
      resolve(repositoryRoot, 'frontend/src/domain/dynamic.ts')
    ]);
    const dependencies = getDependencies(file, `
      import type { Thing } from '@/domain/types';
      export type { other } from './other';
      type Lazy = import('./lazy').Lazy;
      void import('./dynamic');
    `);
    expect(dependencies.map(({ specifier, kind }) => [specifier, kind])).toEqual([
      ['@/domain/types', 'type-only-import'],
      ['./other', 'type-only-re-export'],
      ['./lazy', 'import-type'],
      ['./dynamic', 'dynamic-import']
    ]);
    expect(dependencies.map((dependency) => importDiagnostic(file, dependency, files))).toEqual([
      undefined, undefined, undefined, undefined
    ]);
  });

  it('reports unresolved code dependencies with their source location', () => {
    const file = 'frontend/src/domain/source.ts';
    const diagnostics = architectureDiagnostics(
      new Map([[file, "import { missing } from './missing';\nexport { missing };"]]),
      [{ path: file, responsibility: 'domain' }],
      new Set([resolve(repositoryRoot, file)])
    );
    expect(diagnostics.some((message) => message.startsWith(`${file}:1:`) && message.includes('unresolved import'))).toBe(true);
  });

  it('rejects prohibited layer edges and browser/network/storage globals', () => {
    const domain = 'frontend/src/domain/rule.ts';
    const adapter = 'frontend/src/infrastructure/adapter.ts';
    const diagnostics = architectureDiagnostics(
      new Map([
        [domain, "import { read } from '../infrastructure/adapter';\nexport const run = () => localStorage.getItem('key');"],
        [adapter, 'export const read = () => true;']
      ]),
      [
        { path: domain, responsibility: 'domain' },
        { path: adapter, responsibility: 'outbound-adapter' }
      ],
      new Set([resolve(repositoryRoot, domain), resolve(repositoryRoot, adapter)])
    );
    expect(diagnostics.some((message) => message.includes(`${domain}:1:`) && message.includes('prohibited import edge'))).toBe(true);
    expect(diagnostics.some((message) => message.includes(`${domain}:2:`) && message.includes('localStorage'))).toBe(true);
  });

  it.each([
    ['schedule.getPublishedLineSchedule("L4A", "weekday");', 'getPublishedLineSchedule'],
    ['schedule["getPublishedLineSchedule"]("L4A", "weekday");', 'getPublishedLineSchedule'],
    ['const load = schedule.getPublishedLineSchedule; load("L4A", "weekday");', 'getPublishedLineSchedule'],
    ['const { getRouteShape } = schedule; getRouteShape("L4A");', 'getRouteShape']
  ])('prevents direct or extracted repository access in composition: %s', (source, operation) => {
    const composition = 'frontend/src/main.ts';
    const ports = 'frontend/src/application/ports.ts';
    const diagnostics = architectureDiagnostics(
      new Map([
        [composition, source],
        [ports, 'export interface ScheduleRepositoryV5 { getPublishedLineSchedule(): void; getRouteShape(): void; }']
      ]),
      [
        {
          path: composition,
          responsibility: 'composition',
          rationale: 'Binds concrete adapters and application entry points.'
        },
        { path: ports, responsibility: 'application-port' }
      ],
      new Set([resolve(repositoryRoot, composition), resolve(repositoryRoot, ports)])
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toContain(`composition directly references application repository port "${operation}"`);
  });

  it('enforces inward dependencies and isolated tests for all mapped domain rules/use cases', () => {
    const diagnostics = architectureDiagnostics(
      new Map(sourceModules().map((path) => [path, readFileSync(resolve(repositoryRoot, path), 'utf8')])),
      readArchitectureManifest(),
      projectFiles
    );
    expect(diagnostics, diagnostics.join('\n')).toEqual([]);
  });
});
