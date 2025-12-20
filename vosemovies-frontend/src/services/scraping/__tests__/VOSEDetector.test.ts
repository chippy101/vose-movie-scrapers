import { VOSEDetector } from '../VOSEDetector';
import { Cinema } from '../../../types/Cinema';
import { SAMPLE_CINEMA_LISTINGS } from '../../../data/cinemas/balearicCinemas';

describe('VOSEDetector', () => {
  let detector: VOSEDetector;

  beforeEach(() => {
    detector = new VOSEDetector();
  });

  describe('Basic VOSE Detection', () => {
    test('should detect explicit VOSE indicators', () => {
      const testCases = [
        { text: 'Poor Things - VOSE - 18:30, 21:00', expected: true },
        { text: 'The Zone of Interest - V.O.S.E - 19:15', expected: true },
        { text: 'Barbie - Original Version with Spanish subtitles', expected: true },
        { text: 'Oppenheimer - English with subtitles - 20:15', expected: true }
      ];

      testCases.forEach(testCase => {
        const result = detector.detectVOSE(testCase.text);
        expect(result.isVOSE).toBe(testCase.expected);
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });

    test('should detect dubbed indicators', () => {
      const testCases = [
        { text: 'Dune - Doblada al español - 17:00', expected: false },
        { text: 'Spider-Man - Dubbed in Spanish - 19:30', expected: false },
        { text: 'Avatar - en castellano - 21:00', expected: false }
      ];

      testCases.forEach(testCase => {
        const result = detector.detectVOSE(testCase.text);
        expect(result.isVOSE).toBe(testCase.expected);
        expect(result.confidence).toBeLessThan(0.4);
      });
    });
  });

  describe('Cinema-specific Detection', () => {
    test('should apply cinema-specific rules', () => {
      const cineCiutat: Cinema = {
        id: 'cine-ciutat-palma',
        name: 'CineCiutat',
        chain: 'Independent',
        voseSupport: 'specialist',
        location: {
          lat: 39.5703,
          lng: 2.6500,
          address: "Carrer de L'Emperadriu Eugenia 6",
          city: 'Palma',
          region: 'Balearics'
        },
        source: 'Manual',
        lastUpdated: new Date(),
        verificationStatus: 'verified'
      };

      const result = detector.detectVOSE('Poor Things - 18:30', cineCiutat);

      expect(result.isVOSE).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasons).toContain('Cinema specializes in original version films');
    });

    test('should handle unknown cinemas conservatively', () => {
      const result = detector.detectVOSE('Some Movie - 19:00');

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.detectedLanguage).toBe('Unknown');
    });
  });

  describe('Sample Data Validation', () => {
    test('should correctly classify sample cinema listings', () => {
      SAMPLE_CINEMA_LISTINGS.forEach(sample => {
        const result = detector.detectVOSE(sample.text);

        expect(result.isVOSE).toBe(sample.expected);
        expect(result.confidence).toBeCloseTo(sample.confidence, 1);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty or invalid input', () => {
      const testCases = ['', '   ', 'abc', '123'];

      testCases.forEach(text => {
        const result = detector.detectVOSE(text);
        expect(result.confidence).toBeLessThan(0.3);
        expect(result.detectedLanguage).toBe('Unknown');
      });
    });

    test('should handle contradictory information', () => {
      const text = 'Movie - VOSE and also Doblada - 19:00';
      const result = detector.detectVOSE(text);

      expect(result.reasons).toContain('Warning: Contradictory language indicators found');
      expect(result.confidence).toBeLessThan(0.7); // Reduced due to ambiguity
    });

    test('should detect language context', () => {
      const englishContext = 'English film Inception showing in original language';
      const result = detector.detectVOSE(englishContext);

      expect(result.isVOSE).toBe(true);
      expect(result.reasons.some(r => r.includes('English language context'))).toBe(true);
    });
  });

  describe('Confidence Thresholds', () => {
    test('should provide appropriate threshold recommendations', () => {
      expect(detector.getRecommendedThreshold('strict')).toBe(0.8);
      expect(detector.getRecommendedThreshold('balanced')).toBe(0.6);
      expect(detector.getRecommendedThreshold('permissive')).toBe(0.4);
    });
  });

  describe('Batch Processing', () => {
    test('should handle batch detection', () => {
      const batchItems = [
        { text: 'Movie 1 - VOSE - 18:00' },
        { text: 'Movie 2 - Doblada - 19:00' },
        { text: 'Movie 3 - Original Version - 20:00' }
      ];

      const results = detector.detectBatch(batchItems);

      expect(results).toHaveLength(3);
      expect(results[0].isVOSE).toBe(true);
      expect(results[1].isVOSE).toBe(false);
      expect(results[2].isVOSE).toBe(true);
    });
  });
});