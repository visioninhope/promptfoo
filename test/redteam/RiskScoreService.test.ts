import { Severity } from '../../src/redteam/constants/metadata';
import { BayesianRiskScoreService as RiskScoreService, RiskMatrix } from '../../src/redteam/riskScoring';

describe('Bayesian Risk Score Service', () => {
  describe('calculate', () => {
    describe('edge cases', () => {
      it('should return 0 for many failed attempts with high confidence', () => {
        // With 30+ attempts and no successes, should return 0
        expect(RiskScoreService.calculate(Severity.Critical, 0, 30)).toBe(0);
        expect(RiskScoreService.calculate(Severity.High, 0, 50)).toBe(0);
      });

      it('should return non-zero for no successes with small sample', () => {
        // Small samples should still consider prior
        expect(RiskScoreService.calculate(Severity.Critical, 0, 5)).toBeGreaterThan(0);
        expect(RiskScoreService.calculate(Severity.High, 0, 3)).toBeGreaterThan(0);
      });

      it('should handle zero attempts by using discounted prior', () => {
        // No data should return prior-based estimate
        const criticalScore = RiskScoreService.calculate(Severity.Critical, 0, 0);
        const highScore = RiskScoreService.calculate(Severity.High, 0, 0);
        const mediumScore = RiskScoreService.calculate(Severity.Medium, 0, 0);
        const lowScore = RiskScoreService.calculate(Severity.Low, 0, 0);

        // Should decrease with severity
        expect(criticalScore).toBeGreaterThan(highScore);
        expect(highScore).toBeGreaterThan(mediumScore);
        expect(mediumScore).toBeGreaterThan(lowScore);
        
        // Should be non-zero but moderate
        expect(criticalScore).toBeGreaterThan(0);
        expect(criticalScore).toBeLessThan(5);
      });
    });

    describe('Bayesian updating', () => {
      it('should show prior influence with small samples', () => {
        // 1 success in 1 attempt
        const smallSampleCritical = RiskScoreService.calculate(Severity.Critical, 1, 1);
        const largeSampleCritical = RiskScoreService.calculate(Severity.Critical, 10, 10);

        // Small sample should be pulled toward prior (35%), not 100%
        expect(smallSampleCritical).toBeLessThan(largeSampleCritical);
      });

      it('should converge to empirical rate with large samples', () => {
        // Large sample with 50% success rate
        const critical50 = RiskScoreService.calculate(Severity.Critical, 50, 100);
        const high50 = RiskScoreService.calculate(Severity.High, 50, 100);
        const medium50 = RiskScoreService.calculate(Severity.Medium, 50, 100);
        const low50 = RiskScoreService.calculate(Severity.Low, 50, 100);

        // Should reflect impact weights more than priors
        expect(critical50).toBeGreaterThan(high50);
        expect(high50).toBeGreaterThan(medium50);
        expect(medium50).toBeGreaterThan(low50);
      });

      it('should handle realistic attack scenarios', () => {
        // Critical: SQL injection with moderate success
        const sqlInjection = RiskScoreService.calculate(Severity.Critical, 3, 10);
        expect(sqlInjection).toBeGreaterThanOrEqual(6.0);
        expect(sqlInjection).toBeLessThanOrEqual(8.0);

        // High: XSS with high success
        const xss = RiskScoreService.calculate(Severity.High, 7, 10);
        expect(xss).toBeGreaterThanOrEqual(7.0);
        expect(xss).toBeLessThanOrEqual(9.0);

        // Medium: Information disclosure with low success
        const infoDisclosure = RiskScoreService.calculate(Severity.Medium, 1, 10);
        expect(infoDisclosure).toBeGreaterThanOrEqual(1.0);
        expect(infoDisclosure).toBeLessThanOrEqual(3.0);

        // Low: Output format with high success
        const outputFormat = RiskScoreService.calculate(Severity.Low, 8, 10);
        expect(outputFormat).toBeGreaterThanOrEqual(2.0);
        expect(outputFormat).toBeLessThanOrEqual(4.0);
      });
    });

    describe('confidence adjustment', () => {
      it('should apply Wilson interval for small samples', () => {
        // Compare same success rate with different sample sizes
        const small = RiskScoreService.calculate(Severity.High, 2, 4); // 50% with n=4
        const large = RiskScoreService.calculate(Severity.High, 20, 40); // 50% with n=40

        // Small sample should be more conservative (lower)
        expect(small).toBeLessThan(large);
      });

      it('should not penalize large samples', () => {
        // Both should give similar results for n >= 30
        const n30 = RiskScoreService.calculate(Severity.Medium, 15, 30);
        const n100 = RiskScoreService.calculate(Severity.Medium, 50, 100);

        // Should be very close (within 0.5)
        expect(Math.abs(n30 - n100)).toBeLessThan(0.5);
      });
    });

    describe('input validation', () => {
      it('should throw for negative inputs', () => {
        expect(() => RiskScoreService.calculate(Severity.Low, -1, 10)).toThrow(
          'Successes and attempts must be non-negative'
        );
        expect(() => RiskScoreService.calculate(Severity.Low, 5, -10)).toThrow(
          'Successes and attempts must be non-negative'
        );
      });

      it('should throw when successes exceed attempts', () => {
        expect(() => RiskScoreService.calculate(Severity.Low, 11, 10)).toThrow(
          'Successes cannot exceed attempts'
        );
      });
    });

    describe('score properties', () => {
      it('should always return values between 0 and 10', () => {
        const testCases = [
          { severity: Severity.Critical, successes: 100, attempts: 100 },
          { severity: Severity.High, successes: 0, attempts: 100 },
          { severity: Severity.Medium, successes: 50, attempts: 50 },
          { severity: Severity.Low, successes: 1, attempts: 1000 },
        ];

        testCases.forEach(({ severity, successes, attempts }) => {
          const score = RiskScoreService.calculate(severity, successes, attempts);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(10);
        });
      });

      it('should return scores with one decimal place', () => {
        const score = RiskScoreService.calculate(Severity.High, 13, 37);
        const decimal = score.toString().split('.')[1];
        expect(!decimal || decimal.length <= 1).toBe(true);
      });

      it('should increase monotonically with success rate for fixed severity', () => {
        const scores = [];
        for (let successes = 0; successes <= 10; successes++) {
          scores.push(RiskScoreService.calculate(Severity.High, successes, 10));
        }

        // Each score should be >= previous
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
        }
      });
    });
  });

  describe('getRiskLevel', () => {
    it('should categorize scores correctly', () => {
      expect(RiskScoreService.getRiskLevel(9.5)).toBe('critical');
      expect(RiskScoreService.getRiskLevel(8.5)).toBe('critical');
      expect(RiskScoreService.getRiskLevel(7.5)).toBe('high');
      expect(RiskScoreService.getRiskLevel(6.5)).toBe('high');
      expect(RiskScoreService.getRiskLevel(5.0)).toBe('medium');
      expect(RiskScoreService.getRiskLevel(4.0)).toBe('medium');
      expect(RiskScoreService.getRiskLevel(3.0)).toBe('low');
      expect(RiskScoreService.getRiskLevel(2.0)).toBe('low');
      expect(RiskScoreService.getRiskLevel(1.0)).toBe('minimal');
      expect(RiskScoreService.getRiskLevel(0)).toBe('minimal');
    });
  });

  describe('explainScore', () => {
    it('should provide simple explanation', () => {
      const result = RiskScoreService.explainScore(Severity.High, 7, 10);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('explanation');
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation).toContain('High severity');
      expect(result.explanation).toContain('70% success rate');
    });

    it('should indicate sample size in explanation', () => {
      const result = RiskScoreService.explainScore(Severity.Critical, 2, 3);

      expect(result.explanation).toContain('3 tests');
      expect(result.explanation).toContain('67% success rate');
    });

    it('should not show sample size for large samples', () => {
      const result = RiskScoreService.explainScore(Severity.Medium, 15, 50);

      expect(result.explanation).toContain('30% success rate');
      expect(result.explanation).not.toContain('50 tests');
    });



    it('should handle zero attempts gracefully', () => {
      const result = RiskScoreService.explainScore(Severity.High, 0, 0);

      expect(result.score).toBeGreaterThan(0);
      expect(result.explanation).toContain('no data');
    });
  });

  describe('RiskMatrix', () => {
    it('should map success rates to appropriate zones', () => {
      // Critical severity
      expect(RiskMatrix.getZone(Severity.Critical, 0.9)).toBe('critical');
      expect(RiskMatrix.getZone(Severity.Critical, 0.5)).toBe('high');
      // Using string comparison workaround for zone levels
      const zone = RiskMatrix.getZone(Severity.Critical, 0.1);
      expect(['minimal', 'low', 'medium'].includes(zone)).toBe(true);

      // High severity
      // High severity zones
      let zoneHigh1 = RiskMatrix.getZone(Severity.High, 0.9);
      expect(['high', 'critical'].includes(zoneHigh1)).toBe(true);
      
      let zoneHigh2 = RiskMatrix.getZone(Severity.High, 0.5);
      expect(['medium', 'high', 'critical'].includes(zoneHigh2)).toBe(true);
      
      let zoneHigh3 = RiskMatrix.getZone(Severity.High, 0.1);
      expect(['minimal', 'low', 'medium'].includes(zoneHigh3)).toBe(true);

      // Medium severity
      // Medium severity zones
      let zoneMed1 = RiskMatrix.getZone(Severity.Medium, 0.9);
      expect(['medium', 'high', 'critical'].includes(zoneMed1)).toBe(true);
      
      let zoneMed2 = RiskMatrix.getZone(Severity.Medium, 0.5);
      expect(['low', 'medium', 'high'].includes(zoneMed2)).toBe(true);
      
      expect(RiskMatrix.getZone(Severity.Medium, 0.1)).toBe('low');

      // Low severity
      // Low severity zones
      let zoneLow1 = RiskMatrix.getZone(Severity.Low, 0.9);
      expect(['minimal', 'low', 'medium'].includes(zoneLow1)).toBe(true);
      
      expect(RiskMatrix.getZone(Severity.Low, 0.5)).toBe('low');
      
      let zoneLow2 = RiskMatrix.getZone(Severity.Low, 0.1);
      expect(['minimal', 'low'].includes(zoneLow2)).toBe(true);
    });

    it('should be consistent with direct calculation', () => {
      const directScore = RiskScoreService.calculate(Severity.High, 70, 100);
      const directLevel = RiskScoreService.getRiskLevel(directScore);
      const matrixZone = RiskMatrix.getZone(Severity.High, 0.7);

      // Matrix zone should match or be close to direct calculation
      const zoneToLevel: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
        minimal: 0,
      };

      expect(Math.abs(zoneToLevel[matrixZone] - zoneToLevel[directLevel])).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistical properties', () => {
    it('should show Bayesian shrinkage toward prior', () => {
      // Test that estimates are pulled toward prior with small samples
      const prior = 0.35; // Critical prior mean
      
      // 100% success with n=1 should not give score of 10
      const smallSample100 = RiskScoreService.calculate(Severity.Critical, 1, 1);
      const largeSample100 = RiskScoreService.calculate(Severity.Critical, 100, 100);
      
      expect(smallSample100).toBeLessThan(largeSample100);
      expect(smallSample100).toBeLessThan(9); // Should be pulled down by prior
    });


  });
});