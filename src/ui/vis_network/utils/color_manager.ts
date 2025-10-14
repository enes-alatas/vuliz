import {Package} from 'src/packages/types';
import {Severity, VulnerabilityContainer} from 'src/vulnerabilities/types';
import {NETWORK_COLORS} from '../constants';

/**
 * Service for determining colors for network nodes and edges based on vulnerability status
 *
 * Provides centralized color logic for network visualization, mapping
 * vulnerability severity levels to appropriate visual colors.
 */
export class ColorManager {
  /**
   * Determines the appropriate color for a package based on vulnerability status
   * @param pkg - Package to determine color for
   * @returns Hex color code for the package
   */
  getColorForPackage(pkg: Package): string {
    if (pkg.vulnerabilityContainer) {
      return this.getVulnerabilityColor(pkg.vulnerabilityContainer);
    }
    return NETWORK_COLORS.DEFAULT;
  }

  /**
   * Gets color based on vulnerability container severity
   * @private
   * @param vulnerabilityContainer - The vulnerability container
   * @returns Hex color code based on overall severity
   */
  private getVulnerabilityColor(
    vulnerabilityContainer: VulnerabilityContainer,
  ): string {
    return vulnerabilityContainer?.overallSeverity
      ? this.getSeverityColor(vulnerabilityContainer.overallSeverity)
      : NETWORK_COLORS.DEFAULT;
  }

  /**
   * Maps severity levels to their corresponding colors
   * @private
   * @param severity - The severity level
   * @returns Hex color code for the severity level
   */
  private getSeverityColor(severity: Severity): string {
    const severityColors: Record<Severity, string> = {
      [Severity.Low]: NETWORK_COLORS.SEVERITY.LOW,
      [Severity.Medium]: NETWORK_COLORS.SEVERITY.MEDIUM,
      [Severity.High]: NETWORK_COLORS.SEVERITY.HIGH,
      [Severity.Critical]: NETWORK_COLORS.SEVERITY.CRITICAL,
      [Severity.Unknown]: NETWORK_COLORS.SEVERITY.UNKNOWN,
    };
    return severityColors[severity] || NETWORK_COLORS.DEFAULT;
  }
}
