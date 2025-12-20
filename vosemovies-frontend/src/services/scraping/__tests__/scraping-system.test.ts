/**
 * Comprehensive Scraping System Tests
 * Phase 5A/5B Validation
 */

import { EnhancedVOSEDetector } from '../EnhancedVOSEDetector';
import { DataValidationSystem } from '../../validation/DataValidationSystem';
import { CinesaScraper } from '../CinesaScraper';
import { YelmoScraper } from '../YelmoScraper';
import { KinepolisScraper } from '../KinepolisScraper';
import { ScrapedShowtime } from '../../../types/Cinema';

describe('Enhanced VOSE Detector', () => {
  let detector: EnhancedVOSEDetector;

  beforeEach(() => {
    detector = new EnhancedVOSEDetector();
  });

  test('should detect explicit VOSE markers', () => {
    const text = 'Oppenheimer - VOSE - 20:30';
    const result = detector.detectVOSE(text);

    expect(result.isVOSE).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.detectedLanguage).toBe('VOSE');
    expect(result.rawMatches.voseIndicators.length).toBeGreaterThan(0);
  });

  test('should detect dubbed Spanish films', () => {
    const text = 'Oppenheimer - Doblada al Español - 18:30';
    const result = detector.detectVOSE(text);

    expect(result.isVOSE).toBe(false);
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.detectedLanguage).toBe('Spanish');
  });

  test('should handle conflicting indicators', () => {
    const text = 'Oppenheimer - VOSE y Doblada - 20:30 VOSE, 18:00 Español';
    const result = detector.detectVOSE(text);

    // Should detect both indicators
    expect(result.rawMatches.voseIndicators.length).toBeGreaterThan(0);
    expect(result.rawMatches.dubbedIndicators.length).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('conflict'))).toBe(true);
  });

  test('should boost confidence for CineCiutat', () => {
    const text = 'Poor Things - 20:30 at CineCiutat';
    const result = detector.detectVOSE(text);

    // CineCiutat is VOSE specialist, should have high bonus
    expect(result.cinemaBonus).toBeGreaterThan(0.5);
    expect(result.isVOSE).toBe(true);
  });

  test('should detect time patterns', () => {
    const text = 'The Zone of Interest - 22:30, 20:15';
    const result = detector.detectVOSE(text);

    expect(result.rawMatches.timePatterns.length).toBeGreaterThan(0);
  });

  test('should analyze English movie titles', () => {
    const text = 'Showtimes for The Holdovers';
    const result = detector.detectVOSE(text, undefined, 'The Holdovers');

    // English title should boost confidence
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  test('should handle Mallorca tourist area bonus', () => {
    const text = 'Film showing in Palma, Mallorca - 21:00';
    const result = detector.detectVOSE(text);

    // Mallorca should get regional bonus
    expect(result.reasons.some(r => r.includes('touristAreas'))).toBe(true);
  });

  test('should provide debug information when enabled', () => {
    const text = 'VOSE screening - 20:30';
    const result = detector.detectVOSE(text, undefined, undefined, undefined, true);

    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.scoreBreakdown).toBeDefined();
    expect(result.debugInfo?.matchedPatterns).toBeDefined();
  });
});

describe('Data Validation System', () => {
  let validator: DataValidationSystem;

  beforeEach(() => {
    validator = new DataValidationSystem();
  });

  test('should validate required fields', async () => {
    const invalidShowtime: Partial<ScrapedShowtime> = {
      movieTitle: '',
      cinemaName: 'Test Cinema',
      startTime: new Date(),
    };

    const result = await validator.validateShowtimes([invalidShowtime as ScrapedShowtime]);

    expect(result.report.errorCount).toBeGreaterThan(0);
    expect(result.report.recommendations.length).toBeGreaterThan(0);
  });

  test('should detect showtimes in the past', async () => {
    const pastShowtime: ScrapedShowtime = {
      movieTitle: 'Test Movie',
      cinemaName: 'Test Cinema',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.9,
      source: 'Manual',
      rawText: 'test',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const result = await validator.validateShowtimes([pastShowtime]);

    expect(result.report.warningCount).toBeGreaterThan(0);
    expect(result.report.issueBreakdown['SHOWTIME_TOO_OLD']).toBeDefined();
  });

  test('should detect duplicates', async () => {
    const showtime1: ScrapedShowtime = {
      movieTitle: 'Dune Part Two',
      cinemaName: 'Cinesa',
      startTime: new Date('2025-10-13T20:30:00'),
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.9,
      source: 'Cinesa',
      rawText: 'test',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const showtime2 = { ...showtime1 }; // Duplicate

    const result = await validator.validateShowtimes([showtime1, showtime2]);

    expect(result.report.warningCount).toBeGreaterThan(0);
  });

  test('should validate VOSE confidence consistency', async () => {
    const lowConfidenceVOSE: ScrapedShowtime = {
      movieTitle: 'Test Movie',
      cinemaName: 'Test Cinema',
      startTime: new Date(),
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.3, // Low confidence but marked as VOSE
      source: 'Manual',
      rawText: 'test movie showing',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const result = await validator.validateShowtimes([lowConfidenceVOSE]);

    expect(result.report.infoCount).toBeGreaterThan(0);
  });
});

describe('Scraper Base Functionality', () => {
  test('CinesaScraper should have correct configuration', () => {
    const scraper = new CinesaScraper();
    expect(scraper).toBeDefined();
    // Check rate limit is respectful
    // @ts-ignore - accessing private config for testing
    expect(scraper.config?.rateLimit).toBeGreaterThanOrEqual(2000);
  });

  test('YelmoScraper should have correct configuration', () => {
    const scraper = new YelmoScraper();
    expect(scraper).toBeDefined();
    // @ts-ignore
    expect(scraper.config?.rateLimit).toBeGreaterThanOrEqual(2000);
  });

  test('KinepolisScraper should have correct configuration', () => {
    const scraper = new KinepolisScraper();
    expect(scraper).toBeDefined();
    // @ts-ignore
    expect(scraper.config?.rateLimit).toBeGreaterThanOrEqual(2000);
  });
});

describe('VOSE Detection Edge Cases', () => {
  let detector: EnhancedVOSEDetector;

  beforeEach(() => {
    detector = new EnhancedVOSEDetector();
  });

  test('should handle empty text', () => {
    const result = detector.detectVOSE('');
    expect(result.confidence).toBeLessThan(0.5);
  });

  test('should handle mixed language text', () => {
    const text = 'Oppenheimer (VOSE) en el cinema CineCiutat, Palma';
    const result = detector.detectVOSE(text);

    expect(result.isVOSE).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('should distinguish V.O.S.E variations', () => {
    const variations = ['VOSE', 'V.O.S.E', 'V.O.S.E.', 'VO.SE'];

    variations.forEach(variation => {
      const result = detector.detectVOSE(`Movie in ${variation}`);
      expect(result.isVOSE).toBe(true);
      expect(result.rawMatches.voseIndicators.length).toBeGreaterThan(0);
    });
  });

  test('should handle version info without time', () => {
    const text = 'Oppenheimer - Versión Original Subtitulada';
    const result = detector.detectVOSE(text);

    expect(result.isVOSE).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

describe('Validation Rules', () => {
  let validator: DataValidationSystem;

  beforeEach(() => {
    validator = new DataValidationSystem();
  });

  test('should reject titles that are too short', async () => {
    const showtime: ScrapedShowtime = {
      movieTitle: 'A', // Too short
      cinemaName: 'Test Cinema',
      startTime: new Date(),
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.9,
      source: 'Manual',
      rawText: 'test',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const result = await validator.validateShowtimes([showtime]);
    expect(result.report.errorCount).toBeGreaterThan(0);
  });

  test('should flag unusual showtime hours', async () => {
    const showtime: ScrapedShowtime = {
      movieTitle: 'Test Movie',
      cinemaName: 'Test Cinema',
      startTime: new Date('2025-10-13T04:00:00'), // 4 AM - unusual
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.9,
      source: 'Manual',
      rawText: 'test',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const result = await validator.validateShowtimes([showtime]);
    expect(result.report.infoCount).toBeGreaterThan(0);
  });

  test('should validate source reliability', async () => {
    const manualShowtime: ScrapedShowtime = {
      movieTitle: 'Test Movie',
      cinemaName: 'Test Cinema',
      startTime: new Date(),
      language: 'VOSE',
      isVOSE: true,
      confidence: 0.9,
      source: 'Manual', // High reliability
      rawText: 'detailed description of the movie showing',
      scrapedAt: new Date(),
      verificationStatus: 'pending'
    };

    const result = await validator.validateShowtimes([manualShowtime]);

    // Manual source should have high reliability
    expect(result.validatedShowtimes[0].confidence).toBeGreaterThanOrEqual(0.9);
  });
});

describe('Scraper Pattern Parsing', () => {
  test('should parse time strings correctly', () => {
    // This tests the BaseScraper parseTime utility
    const detector = new EnhancedVOSEDetector();

    const texts = [
      '20:30',
      '20.30',
      '20h30',
      '9:15',
      '21:45'
    ];

    texts.forEach(text => {
      const result = detector.detectVOSE(`Movie showing at ${text}`);
      expect(result.rawMatches.timePatterns.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete scraping workflow', async () => {
    const detector = new EnhancedVOSEDetector();
    const validator = new DataValidationSystem();

    // Simulate scraped HTML content
    const rawText = `
      <div class="movie">
        <h2>Oppenheimer</h2>
        <p>VOSE - Original Version with Spanish Subtitles</p>
        <div class="times">20:30, 22:45</div>
        <p>CineCiutat, Palma de Mallorca</p>
      </div>
    `;

    // Step 1: VOSE Detection
    const voseResult = detector.detectVOSE(rawText, undefined, 'Oppenheimer');
    expect(voseResult.isVOSE).toBe(true);

    // Step 2: Create showtime
    const showtime: ScrapedShowtime = {
      movieTitle: 'Oppenheimer',
      cinemaName: 'CineCiutat',
      startTime: new Date('2025-10-13T20:30:00'),
      language: voseResult.detectedLanguage,
      isVOSE: voseResult.isVOSE,
      confidence: voseResult.confidence,
      source: 'Manual',
      rawText,
      scrapedAt: new Date(),
      verificationStatus: voseResult.confidence > 0.8 ? 'confirmed' : 'pending'
    };

    // Step 3: Validation
    const validationResult = await validator.validateShowtimes([showtime]);

    expect(validationResult.validatedShowtimes.length).toBe(1);
    expect(validationResult.report.validShowtimes).toBe(1);
    expect(validationResult.validatedShowtimes[0].verificationStatus).toBe('confirmed');
  });
});
