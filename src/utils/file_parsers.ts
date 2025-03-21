import {JsonMap, parse as tomlParse} from '@iarna/toml';

/**
 * Parses a TOML formatted string into a JSON object
 * @param content The TOML content to parse
 * @returns A Promise resolving to the parsed JSON object
 * @throws Error if parsing fails
 */
export function parseToml(content: string): JsonMap {
  try {
    return tomlParse(content);
  } catch (error) {
    throw new Error(`Failed to parse TOML: ${(error as Error).message}`);
  }
}
