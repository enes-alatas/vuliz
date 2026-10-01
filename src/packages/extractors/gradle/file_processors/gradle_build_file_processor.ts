import {AbstractFileProcessor} from '../../file_processor';
import {LATEST_VERSION, Package, PackageType} from '../../../types';

/**
 * Matches a dependency given as a string, e.g. "group:artifact:version",
 * optionally followed by a classifier and/or an "@extension"
 */
const COORDINATE_PATTERN =
  /^([\w.-]+):([\w.-]+)(?::([^:@\s]+))?(?::[\w.-]+)?(?:@\w+)?$/;

/**
 * Matches a dependency given in map notation, in Groovy
 * (group: 'g', name: 'a', version: 'v') or Kotlin
 * (group = "g", name = "a", version = "v") syntax
 */
const MAP_NOTATION_PATTERN =
  /\bgroup\s*[:=]\s*(['"])([^'"]+)\1\s*,\s*name\s*[:=]\s*(['"])([^'"]+)\3(?:\s*,\s*version\s*[:=]\s*(?:(['"])([^'"]*)\5|([\w.]+)))?/g;

/** Matches string literals */
const STRING_LITERAL_PATTERN = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;

/**
 * Matches simple variable definitions with a literal string value:
 * - def springVersion = '5.3.1' / val springVersion = "5.3.1"
 * - ext.springVersion = '5.3.1' / springVersion = '5.3.1' (in an ext block)
 * - extra["springVersion"] = "5.3.1"
 * - val springVersion by extra("5.3.1")
 * - set("springVersion", "5.3.1")
 */
const VARIABLE_PATTERNS = [
  /(?:^|[\s;{(])(?:(?:def|val|var|String)\s+)?(?:(?:project\.|rootProject\.)?ext\.)?([A-Za-z_]\w*)\s*=\s*(['"])([^'"$\n]*)\2/gm,
  /\bextra\s*\[\s*(['"])(\w+)\1\s*\]\s*=\s*(['"])([^'"$\n]*)\3/g,
  /\bval\s+(\w+)\s+by\s+extra\s*\(\s*"([^"$\n]*)"\s*\)/g,
  /\bset\s*\(\s*(['"])(\w+)\1\s*,\s*(['"])([^'"$\n]*)\3\s*\)/g,
];

/**
 * Processes Gradle build scripts (build.gradle and build.gradle.kts)
 *
 * Collects the dependencies declared in `dependencies { ... }` blocks,
 * as strings ("group:artifact:version") or in map notation. Simple
 * variables defined with a literal value are substituted into versions.
 *
 * Dependencies from version catalogs (`libs.foo`), project dependencies,
 * and the build script's own classpath are not included. Versions that
 * cannot be resolved to an exact version are reported as the latest.
 */
export class GradleBuildFileProcessor extends AbstractFileProcessor {
  /**
   * Removes comments from the build script content
   */
  protected async parseRawData(fileContent: string): Promise<string> {
    return GradleBuildFileProcessor.stripComments(fileContent);
  }

  /**
   * Extracts the declared dependencies from the build script content
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const content = rawData as string;
    const variables = GradleBuildFileProcessor.collectVariables(content);
    const scriptWithoutBuildscript = GradleBuildFileProcessor.removeBlocks(
      content,
      'buildscript',
    );
    const dependencyBlocks = GradleBuildFileProcessor.findBlocks(
      scriptWithoutBuildscript,
      'dependencies',
    ).map(block => GradleBuildFileProcessor.removeBlocks(block, 'constraints'));

    const packages: Package[] = [];
    for (const block of dependencyBlocks) {
      packages.push(
        ...GradleBuildFileProcessor.parseStringNotation(block, variables),
        ...GradleBuildFileProcessor.parseMapNotation(block, variables),
      );
    }
    return packages;
  }

  /**
   * Parses dependencies declared as "group:artifact:version" strings
   */
  private static parseStringNotation(
    block: string,
    variables: Map<string, string>,
  ): Package[] {
    const packages: Package[] = [];
    for (const match of block.matchAll(STRING_LITERAL_PATTERN)) {
      const literal = this.substituteVariables(match[2], variables);
      const coordinate = literal.match(COORDINATE_PATTERN);
      if (!coordinate) continue;
      packages.push(
        this.createPackage(coordinate[1], coordinate[2], coordinate[3]),
      );
    }
    return packages;
  }

  /**
   * Parses dependencies declared in map notation (group, name, version)
   */
  private static parseMapNotation(
    block: string,
    variables: Map<string, string>,
  ): Package[] {
    const packages: Package[] = [];
    for (const match of block.matchAll(MAP_NOTATION_PATTERN)) {
      const [, , group, , artifact, , quotedVersion, versionVariable] = match;
      let version = quotedVersion;
      if (versionVariable !== undefined) {
        version = `\${${versionVariable}}`;
      }
      packages.push(
        this.createPackage(
          this.substituteVariables(group, variables),
          this.substituteVariables(artifact, variables),
          version === undefined
            ? undefined
            : this.substituteVariables(version, variables),
        ),
      );
    }
    return packages;
  }

  /**
   * Creates a Maven package from its coordinates
   */
  private static createPackage(
    group: string,
    artifact: string,
    version: string | undefined,
  ): Package {
    return {
      name: `${group}:${artifact}`,
      version: this.cleanVersion(version),
      type: PackageType.MAVEN,
    };
  }

  /**
   * Returns the exact version, or LATEST_VERSION for missing versions,
   * unresolved variables, dynamic versions ("1.+", "latest.release")
   * and version ranges ("[1.0,2.0)")
   */
  private static cleanVersion(version: string | undefined): string {
    const cleaned = (version ?? '').trim().replace(/!!$/, '');
    if (
      !cleaned ||
      /[$+[\](),\s]/.test(cleaned) ||
      cleaned.startsWith('latest.')
    ) {
      return LATEST_VERSION;
    }
    return cleaned;
  }

  /**
   * Replaces `$name` and `${name}` references with known variable values.
   * Qualified references such as `${rootProject.ext.name}` are looked up by
   * their last segment. Unknown references are left in place.
   */
  private static substituteVariables(
    value: string,
    variables: Map<string, string>,
  ): string {
    return value.replace(
      /\$\{\s*([\w.]+)\s*\}|\$([A-Za-z_]\w*)/g,
      (reference, qualifiedName?: string, simpleName?: string) => {
        const name = (qualifiedName ?? simpleName ?? '').split('.').pop()!;
        return variables.get(name) ?? reference;
      },
    );
  }

  /**
   * Collects variables that are defined with a literal string value
   */
  private static collectVariables(content: string): Map<string, string> {
    const variables = new Map<string, string>();
    for (const match of content.matchAll(VARIABLE_PATTERNS[0])) {
      variables.set(match[1], match[3]);
    }
    for (const match of content.matchAll(VARIABLE_PATTERNS[1])) {
      variables.set(match[2], match[4]);
    }
    for (const match of content.matchAll(VARIABLE_PATTERNS[2])) {
      variables.set(match[1], match[2]);
    }
    for (const match of content.matchAll(VARIABLE_PATTERNS[3])) {
      variables.set(match[2], match[4]);
    }
    return variables;
  }

  /**
   * Returns the contents of every `name { ... }` block
   */
  private static findBlocks(content: string, name: string): string[] {
    return this.locateBlocks(content, name).map(({start, end}) =>
      content.slice(start, end),
    );
  }

  /**
   * Returns the content with every `name { ... }` block removed
   */
  private static removeBlocks(content: string, name: string): string {
    let result = content;
    for (const {start, end} of this.locateBlocks(content, name).reverse()) {
      result = result.slice(0, start) + result.slice(end);
    }
    return result;
  }

  /**
   * Finds the outermost `name { ... }` blocks and returns the positions of
   * their contents, ignoring braces inside string literals
   */
  private static locateBlocks(
    content: string,
    name: string,
  ): {start: number; end: number}[] {
    const blocks: {start: number; end: number}[] = [];
    const opening = new RegExp(`\\b${name}\\s*\\{`, 'g');
    let match: RegExpExecArray | null;
    while ((match = opening.exec(content)) !== null) {
      const start = match.index + match[0].length;
      const end = this.findClosingBrace(content, start);
      blocks.push({start, end});
      opening.lastIndex = Math.min(end + 1, content.length);
    }
    return blocks;
  }

  /**
   * Returns the index of the brace that closes a block starting at `start`,
   * or the end of the content if the block is never closed
   */
  private static findClosingBrace(content: string, start: number): number {
    let depth = 1;
    let quote: string | null = null;
    for (let i = start; i < content.length; i++) {
      const char = content[i];
      if (quote) {
        if (char === '\\') i++;
        else if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '{') {
        depth++;
      } else if (char === '}' && --depth === 0) {
        return i;
      }
    }
    return content.length;
  }

  /**
   * Removes line and block comments, leaving string literals intact
   */
  static stripComments(content: string): string {
    let result = '';
    let quote: string | null = null;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];
      if (quote) {
        result += char;
        if (char === '\\' && next !== undefined) {
          result += next;
          i++;
        } else if (char === quote || char === '\n') {
          quote = null;
        }
      } else if (char === '/' && next === '/') {
        while (i < content.length && content[i] !== '\n') i++;
        result += '\n';
      } else if (char === '/' && next === '*') {
        const end = content.indexOf('*/', i + 2);
        i = end === -1 ? content.length : end + 1;
        result += ' ';
      } else {
        if (char === '"' || char === "'") quote = char;
        result += char;
      }
    }
    return result;
  }
}
