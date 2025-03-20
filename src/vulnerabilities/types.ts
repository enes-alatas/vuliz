/**
 * Represents a collection of vulnerabilities with an overall severity.
 */
export interface VulnerabilityContainer {
  vulnerabilities: Vulnerability[];
  overallSeverity: Severity;
}

/**
 * Represents a single vulnerability with its metadata and severity information.
 */
export interface Vulnerability {
  name: string;
  severity: Severity;
  cvssScore: number;
  cveId?: string;
}

/**
 * Represents the severity level of a vulnerability.
 */
export enum Severity {
  Unknown = 'UNKNOWN',
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Critical = 'CRITICAL',
}
