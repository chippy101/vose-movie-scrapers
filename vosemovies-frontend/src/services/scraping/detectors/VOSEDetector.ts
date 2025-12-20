import { Cinema, VOSESupport } from '../../../types/Cinema';

export interface VOSEDetectionResult {
  isVOSE: boolean;
  confidence: number;
  reasons: string[];
  detectedLanguage: 'VOSE' | 'Spanish' | 'Catalan' | 'Other' | 'Unknown';
  rawMatches: {
    voseIndicators: string[];
    dubbedIndicators: string[];
    languageIndicators: string[];
  };
}

export class VOSEDetector {
  private readonly VOSE_INDICATORS = [
    // Explicit VOSE markers
    'VOSE', 'V.O.S.E', 'V.O.S.E.', 'VOSE.',
    'VOS', 'V.O.S', 'V.O.S.',
    'VO', 'V.O', 'V.O.',
    'V O S E', 'V O S',

    // English language indicators
    'Original Version', 'original version',
    'Original Language', 'original language',
    'English', 'english', 'English subtitles', 'english subtitles',
    'in English', 'films in English', 'film in English',
    'English-language', 'English language',

    // Spanish indicators for original version
    'Versión Original', 'versión original', 'version original',
    'Versión Original Subtitulada', 'versión original subtitulada',
    'versió original', 'Versió Original',
    'Idioma Original', 'idioma original',
    'con subtítulos', 'con subtitulos',
    'subtitulada en español', 'subtitulada en castellano',
    'subtitled in spanish', 'subtitled in Spanish',

    // Catalan indicators
    'amb subtítols', 'amb subtitols en català', 'amb subtitols en castellà',

    // Context indicators
    'original with subtitles', 'original w/ subtitles',
    'subtitled', 'not dubbed', 'undubbed',

    // URL patterns
    'vose=true', 'vose=1', '/vose/', '/original-version/'
  ];

  private readonly DUBBED_INDICATORS = [
    'Doblada', 'doblada', 'doblado', 'Doblado',
    'Español', 'español', 'Spanish',
    'Castellano', 'castellano',
    'Dubbed', 'dubbed', 'spanish dubbed',
    'doblaje español', 'doblaje castellano',
    'en español', 'en castellano'
  ];

  private readonly LANGUAGE_PATTERNS = {
    english: [
      'English', 'english', 'inglés', 'ingles',
      'English film', 'English movie',
      'American', 'British', 'Australian',
      'Hollywood', 'UK film', 'US film'
    ],
    spanish: [
      'Español', 'español', 'Spanish',
      'Castellano', 'castellano',
      'película española', 'film español',
      'cine español'
    ],
    catalan: [
      'Català', 'català', 'Catalan', 'catalan',
      'en català', 'película catalana'
    ]
  };

  private readonly CINEMA_VOSE_PATTERNS = {
    'CineCiutat': {
      defaultConfidence: 0.85,
      voseSpecialist: true,
      notes: 'Only shows original version films'
    },
    'Ocimax': {
      defaultConfidence: 0.3,
      voseSupport: 'frequent',
      notes: 'Commercial cinema with VOSE options'
    },
    'Cinesa': {
      defaultConfidence: 0.25,
      voseSupport: 'occasional',
      notes: 'Major chain with selective VOSE'
    }
  };

  detectVOSE(
    text: string,
    cinema?: Cinema,
    movieTitle?: string,
    debug = false
  ): VOSEDetectionResult {
    const normalizedText = this.normalizeText(text);

    if (debug) {
      console.log('\n🔍 VOSEDetector Debug:');
      console.log('Original text (first 500 chars):', text.substring(0, 500));
      console.log('Normalized text:', normalizedText.substring(0, 300));
      console.log('Cinema:', cinema?.name);
      console.log('Movie title:', movieTitle);
    }

    let confidence = 0;
    const reasons: string[] = [];
    const rawMatches = {
      voseIndicators: [] as string[],
      dubbedIndicators: [] as string[],
      languageIndicators: [] as string[]
    };

    // 1. Cinema-specific rules (highest weight)
    if (cinema) {
      const cinemaBonus = this.applyCinemaRules(cinema, reasons);
      confidence += cinemaBonus;
    }

    // 2. Explicit VOSE indicators
    const voseMatches = this.findPatterns(normalizedText, this.VOSE_INDICATORS);
    if (voseMatches.length > 0) {
      confidence += 0.4;
      rawMatches.voseIndicators = voseMatches;
      reasons.push(`Found VOSE indicators: ${voseMatches.join(', ')}`);
    }

    // 3. Anti-patterns (dubbed indicators)
    const dubbedMatches = this.findPatterns(normalizedText, this.DUBBED_INDICATORS);
    if (dubbedMatches.length > 0) {
      confidence -= 0.6;
      rawMatches.dubbedIndicators = dubbedMatches;
      reasons.push(`Found dubbed indicators: ${dubbedMatches.join(', ')}`);
    }

    // 4. Language context analysis
    const languageScore = this.analyzeLanguageContext(normalizedText, rawMatches, reasons);
    confidence += languageScore;

    // 5. Time-based patterns (VOSE often shown at specific times)
    const timeScore = this.analyzeTimePatterns(normalizedText, reasons);
    confidence += timeScore;

    // 6. Movie title analysis (if available)
    if (movieTitle) {
      const titleScore = this.analyzeMovieTitle(movieTitle, reasons);
      confidence += titleScore;
    }

    // 7. Context coherence check
    const coherenceScore = this.checkCoherence(normalizedText, reasons);
    confidence += coherenceScore;

    // Normalize confidence to 0-1 range
    confidence = Math.max(0, Math.min(1, confidence));

    // Determine detected language
    const detectedLanguage = this.determineLanguage(rawMatches, confidence);

    if (debug) {
      console.log('\n📊 Detection Results:');
      console.log('VOSE Indicators Found:', rawMatches.voseIndicators);
      console.log('Dubbed Indicators Found:', rawMatches.dubbedIndicators);
      console.log('Language Indicators Found:', rawMatches.languageIndicators);
      console.log('Confidence Score:', confidence.toFixed(2));
      console.log('Is VOSE?', confidence > 0.4);
      console.log('Detected Language:', detectedLanguage);
      console.log('Reasons:', reasons);
    }

    return {
      isVOSE: confidence > 0.4, // Lowered threshold to be more inclusive
      confidence,
      reasons,
      detectedLanguage,
      rawMatches
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.:,]/g, ''); // Remove special chars except punctuation
  }

  private findPatterns(text: string, patterns: string[]): string[] {
    const matches: string[] = [];
    const normalizedText = text.toLowerCase();

    patterns.forEach(pattern => {
      if (normalizedText.includes(pattern.toLowerCase())) {
        matches.push(pattern);
      }
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  private applyCinemaRules(cinema: Cinema, reasons: string[]): number {
    const cinemaConfig = this.CINEMA_VOSE_PATTERNS[cinema.name as keyof typeof this.CINEMA_VOSE_PATTERNS];

    if (cinemaConfig) {
      if ('voseSpecialist' in cinemaConfig && cinemaConfig.voseSpecialist) {
        reasons.push(`${cinema.name} is a VOSE specialist cinema`);
        return cinemaConfig.defaultConfidence;
      }
    }

    // General cinema support level
    switch (cinema.voseSupport) {
      case 'specialist':
        reasons.push('Cinema specializes in original version films');
        return 0.8;
      case 'frequent':
        reasons.push('Cinema frequently shows VOSE films');
        return 0.3;
      case 'occasional':
        reasons.push('Cinema occasionally shows VOSE films');
        return 0.1;
      case 'rare':
        reasons.push('Cinema rarely shows VOSE films');
        return -0.1;
      default:
        return 0;
    }
  }

  private analyzeLanguageContext(
    text: string,
    rawMatches: VOSEDetectionResult['rawMatches'],
    reasons: string[]
  ): number {
    let score = 0;

    // Check for English language indicators
    const englishMatches = this.findPatterns(text, this.LANGUAGE_PATTERNS.english);
    if (englishMatches.length > 0) {
      score += 0.3;
      rawMatches.languageIndicators.push(...englishMatches);
      reasons.push(`English language context: ${englishMatches.join(', ')}`);
    }

    // Check for Spanish language indicators (negative for VOSE)
    const spanishMatches = this.findPatterns(text, this.LANGUAGE_PATTERNS.spanish);
    if (spanishMatches.length > 0 && !text.includes('subtit')) {
      score -= 0.2;
      rawMatches.languageIndicators.push(...spanishMatches);
      reasons.push(`Spanish language context (may be dubbed): ${spanishMatches.join(', ')}`);
    }

    return score;
  }

  private analyzeTimePatterns(text: string, reasons: string[]): number {
    // VOSE films often have specific time patterns in Spain
    const timePattern = /(\d{1,2})[:.h](\d{2})/g;
    const times: number[] = [];
    let match;

    while ((match = timePattern.exec(text)) !== null) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      times.push(hour + minute / 60);
    }

    if (times.length > 0) {
      // VOSE films often shown at later hours (after 8 PM) or specific matinee times
      const lateShows = times.filter(time => time >= 20 || time <= 15);
      if (lateShows.length > 0) {
        reasons.push('Showtime pattern suggests VOSE (late evening or matinee)');
        return 0.1;
      }
    }

    return 0;
  }

  private analyzeMovieTitle(movieTitle: string, reasons: string[]): number {
    const normalizedTitle = movieTitle.toLowerCase();

    // Check if title contains non-Spanish words (suggesting original language)
    const commonEnglishWords = ['the', 'and', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by'];
    const englishWordCount = commonEnglishWords.filter(word =>
      normalizedTitle.includes(` ${word} `) ||
      normalizedTitle.startsWith(`${word} `) ||
      normalizedTitle.endsWith(` ${word}`)
    ).length;

    if (englishWordCount >= 2) {
      reasons.push('Movie title suggests English original language');
      return 0.2;
    }

    return 0;
  }

  private checkCoherence(text: string, reasons: string[]): number {
    // Check for contradictory information
    const hasVOSE = this.findPatterns(text, this.VOSE_INDICATORS).length > 0;
    const hasDubbed = this.findPatterns(text, this.DUBBED_INDICATORS).length > 0;

    if (hasVOSE && hasDubbed) {
      reasons.push('Warning: Contradictory language indicators found');
      return -0.1; // Reduce confidence for ambiguous content
    }

    return 0;
  }

  private determineLanguage(
    rawMatches: VOSEDetectionResult['rawMatches'],
    confidence: number
  ): VOSEDetectionResult['detectedLanguage'] {
    if (confidence > 0.6 && rawMatches.voseIndicators.length > 0) {
      return 'VOSE';
    }

    if (rawMatches.dubbedIndicators.length > 0) {
      return 'Spanish';
    }

    const catalan = rawMatches.languageIndicators.some(indicator =>
      indicator.toLowerCase().includes('català') || indicator.toLowerCase().includes('catalan')
    );

    if (catalan) {
      return 'Catalan';
    }

    return confidence > 0.4 ? 'VOSE' : 'Unknown';
  }

  // Helper method for batch processing
  detectBatch(items: Array<{ text: string; cinema?: Cinema; movieTitle?: string }>): VOSEDetectionResult[] {
    return items.map(item => this.detectVOSE(item.text, item.cinema, item.movieTitle));
  }

  // Get confidence threshold recommendations based on context
  getRecommendedThreshold(context: 'strict' | 'balanced' | 'permissive'): number {
    switch (context) {
      case 'strict':
        return 0.8; // High confidence required
      case 'balanced':
        return 0.6; // Balanced approach
      case 'permissive':
        return 0.4; // More inclusive
      default:
        return 0.6;
    }
  }
}