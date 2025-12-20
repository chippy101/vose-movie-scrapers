import { Cinema, VOSESupport } from '../../../types/Cinema';

export interface EnhancedVOSEDetectionResult {
  isVOSE: boolean;
  confidence: number;
  reasons: string[];
  detectedLanguage: 'VOSE' | 'Spanish' | 'Catalan' | 'Other' | 'Unknown';
  rawMatches: {
    voseIndicators: string[];
    dubbedIndicators: string[];
    languageIndicators: string[];
    contextualCues: string[];
    timePatterns: string[];
  };
  cinemaBonus: number;
  algorithmVersion: string;
  debugInfo?: {
    scoreBreakdown: Record<string, number>;
    matchedPatterns: string[];
    conflictResolution: string[];
  };
}

export class EnhancedVOSEDetector {
  private readonly VERSION = '2.0.0';

  // Enhanced VOSE indicators with weighted confidence scores
  private readonly VOSE_PATTERNS = {
    // Highest confidence - explicit VOSE markers
    explicit: {
      weight: 0.9,
      patterns: [
        /\bVOSE\b/i,
        /\bV\.O\.S\.E\.?\b/i,
        /\bV\.O\.S\b/i,
        /\bVO\.SE\b/i,
        /\bVersion[^a-z]*Original[^a-z]*Subtitulada\b/i,
        /\bVersión[^a-z]*Original[^a-z]*Subtitulada\b/i
      ]
    },

    // High confidence - clear original version indicators
    original: {
      weight: 0.8,
      patterns: [
        /\bOriginal[^a-z]*Version[^a-z]*Subtitled?\b/i,
        /\bOriginal[^a-z]*Language[^a-z]*Subtitled?\b/i,
        /\bIdioma[^a-z]*Original\b/i,
        /\bVersión[^a-z]*Original\b/i,
        /\bOriginal[^a-z]*con[^a-z]*subtítulos\b/i,
        /\bOriginal[^a-z]*with[^a-z]*subtitles\b/i
      ]
    },

    // Medium-high confidence - English language indicators
    english: {
      weight: 0.7,
      patterns: [
        /\bEnglish[^a-z]*subtitles\b/i,
        /\bsubtitled[^a-z]*in[^a-z]*Spanish\b/i,
        /\bsubtitulada[^a-z]*en[^a-z]*español\b/i,
        /\bin[^a-z]*English[^a-z]*language\b/i,
        /\bfilm[^a-z]*in[^a-z]*English\b/i,
        /\bEnglish-language\b/i,
        /\bHollywood[^a-z]*original\b/i
      ]
    },

    // Medium confidence - contextual indicators
    contextual: {
      weight: 0.6,
      patterns: [
        /\bnot[^a-z]*dubbed\b/i,
        /\bundubbed\b/i,
        /\bsubtitled\b/i,
        /\bcon[^a-z]*subtítulos\b/i,
        /\boriginal[^a-z]*audio\b/i,
        /\boriginal[^a-z]*sound\b/i,
        /\bsonido[^a-z]*original\b/i
      ]
    },

    // Lower confidence - weak indicators
    weak: {
      weight: 0.3,
      patterns: [
        /\bEnglish\b/i,
        /\boriginal\b/i,
        /\bsubtítulos\b/i,
        /\bsubtitles\b/i
      ]
    }
  };

  // Enhanced dubbed indicators with negative scoring
  private readonly DUBBED_PATTERNS = {
    explicit: {
      weight: -0.9,
      patterns: [
        /\bDoblada[^a-z]*al[^a-z]*Español\b/i,
        /\bDoblado[^a-z]*al[^a-z]*Castellano\b/i,
        /\bSpanish[^a-z]*Dubbed\b/i,
        /\bDoblaje[^a-z]*Español\b/i,
        /\bVersión[^a-z]*Española\b/i,
        /\bEn[^a-z]*Castellano[^a-z]*Doblada\b/i
      ]
    },

    strong: {
      weight: -0.7,
      patterns: [
        /\bDoblada?\b/i,
        /\bDoblado?\b/i,
        /\bCastellano\b/i,
        /\bEn[^a-z]*Español\b/i,
        /\bSpanish[^a-z]*Version\b/i,
        /\bVersión[^a-z]*en[^a-z]*Español\b/i
      ]
    },

    medium: {
      weight: -0.4,
      patterns: [
        /\bEspañol\b/i,
        /\bSpanish\b/i,
        // Only negative if not in context with subtitles
        /(?<!con\s{0,3}subtítulos\s{0,10})\bespañol\b/i,
        /(?<!subtitled\s{0,10}in\s{0,5})\bspanish\b/i
      ]
    }
  };

  // Cinema chain specific patterns and confidence multipliers
  private readonly CINEMA_PATTERNS: Record<string, {
    voseSpecialist?: boolean;
    voseSupport?: string;
    baseBonus: number;
    patterns: RegExp[];
    voseMarkers?: RegExp[];
  }> = {
    'CineCiutat': {
      voseSpecialist: true,
      baseBonus: 0.85,
      patterns: [
        /cinema[^a-z]*ciutat/i,
        /cine[^a-z]*ciutat/i
      ]
    },

    'Cinesa': {
      voseSupport: 'occasional',
      baseBonus: 0.2,
      patterns: [
        /cinesa/i,
        /\/cinesa\//i
      ],
      voseMarkers: [
        /cinesa[^a-z]*vose/i,
        /vose[^a-z]*cinesa/i
      ]
    },

    'Yelmo': {
      voseSupport: 'frequent',
      baseBonus: 0.3,
      patterns: [
        /yelmo[^a-z]*cines?/i,
        /\/yelmo/i
      ],
      voseMarkers: [
        /yelmo[^a-z]*original/i,
        /yelmo[^a-z]*vose/i
      ]
    },

    'Kinépolis': {
      voseSupport: 'frequent',
      baseBonus: 0.35,
      patterns: [
        /kinépolis/i,
        /kinepolis/i,
        /\/kinepolis/i
      ]
    }
  };

  // Time-based patterns (VOSE often at specific times in Spain)
  private readonly TIME_PATTERNS = {
    voseFavorable: {
      weight: 0.15,
      patterns: [
        // Late evening shows (often VOSE)
        /(?:2[0-3]|1[89])[:.][0-5]\d/g,
        // Matinee times (often VOSE for international audience)
        /(?:1[0-5])[:.][0-5]\d/g,
        // Weekend evening VOSE pattern
        /(sábado|domingo|saturday|sunday).*(?:2[0-2]|19)[:.][0-5]\d/gi
      ]
    },

    dubbedFavorable: {
      weight: -0.1,
      patterns: [
        // Prime time Spanish dubbed shows
        /(?:1[67]|18)[:.][0-5]\d/g
      ]
    }
  };

  // Regional and cultural patterns
  private readonly REGIONAL_PATTERNS = {
    catalonia: {
      weight: 0.2,
      patterns: [
        /barcelona/i,
        /catalunya/i,
        /catalan/i,
        /català/i,
        /\/barcelona\//i
      ]
    },

    madrid: {
      weight: 0.1,
      patterns: [
        /madrid/i,
        /\/madrid\//i,
        /comunidad.*madrid/i
      ]
    },

    valencia: {
      weight: 0.15,
      patterns: [
        /valencia/i,
        /\/valencia\//i,
        /comunidad.*valenciana/i
      ]
    },

    touristAreas: {
      weight: 0.25,
      patterns: [
        /mallorca/i,
        /ibiza/i,
        /costa.*del.*sol/i,
        /marbella/i,
        /benidorm/i,
        /sitges/i
      ]
    }
  };

  detectVOSE(
    text: string,
    cinema?: Cinema,
    movieTitle?: string,
    url?: string,
    enableDebug: boolean = false
  ): EnhancedVOSEDetectionResult {

    const normalizedText = this.normalizeText(text);
    let totalScore = 0;
    const reasons: string[] = [];
    const debugInfo = enableDebug ? {
      scoreBreakdown: {} as Record<string, number>,
      matchedPatterns: [] as string[],
      conflictResolution: [] as string[]
    } : undefined;

    const rawMatches = {
      voseIndicators: [] as string[],
      dubbedIndicators: [] as string[],
      languageIndicators: [] as string[],
      contextualCues: [] as string[],
      timePatterns: [] as string[]
    };

    // 1. Apply VOSE pattern matching with weighted scoring
    const voseScore = this.analyzeVOSEPatterns(normalizedText, rawMatches, reasons, debugInfo);
    totalScore += voseScore;

    // 2. Apply dubbed pattern matching (negative scoring)
    const dubbedScore = this.analyzeDubbedPatterns(normalizedText, rawMatches, reasons, debugInfo);
    totalScore += dubbedScore;

    // 3. Cinema-specific analysis
    const cinemaBonus = this.analyzeCinema(cinema, url, normalizedText, reasons, debugInfo);
    totalScore += cinemaBonus;

    // 4. Time pattern analysis
    const timeScore = this.analyzeTimePatterns(normalizedText, rawMatches, reasons, debugInfo);
    totalScore += timeScore;

    // 5. Regional and cultural context
    const regionalScore = this.analyzeRegionalContext(normalizedText + (url || ''), reasons, debugInfo);
    totalScore += regionalScore;

    // 6. Movie title analysis
    const titleScore = movieTitle ? this.analyzeMovieTitle(movieTitle, reasons, debugInfo) : 0;
    totalScore += titleScore;

    // 7. Contextual coherence and conflict resolution
    const coherenceScore = this.resolveConflicts(normalizedText, rawMatches, reasons, debugInfo);
    totalScore += coherenceScore;

    // 8. Apply final normalization and confidence calculation
    const confidence = this.calculateFinalConfidence(totalScore, rawMatches);

    // 9. Language determination
    const detectedLanguage = this.determineLanguage(rawMatches, confidence);

    if (debugInfo) {
      debugInfo.scoreBreakdown['final_total'] = totalScore;
      debugInfo.scoreBreakdown['normalized_confidence'] = confidence;
    }

    return {
      isVOSE: confidence > 0.6,
      confidence,
      reasons,
      detectedLanguage,
      rawMatches,
      cinemaBonus,
      algorithmVersion: this.VERSION,
      debugInfo
    };
  }

  private analyzeVOSEPatterns(
    text: string,
    rawMatches: any,
    reasons: string[],
    debugInfo?: any
  ): number {
    let score = 0;

    Object.entries(this.VOSE_PATTERNS).forEach(([category, config]) => {
      let categoryScore = 0;

      config.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          const patternScore = config.weight;
          categoryScore += patternScore;

          rawMatches.voseIndicators.push(...matches);

          if (debugInfo) {
            debugInfo.scoreBreakdown[`vose_${category}`] = (debugInfo.scoreBreakdown[`vose_${category}`] || 0) + patternScore;
            debugInfo.matchedPatterns.push(`VOSE-${category}: ${pattern}`);
          }
        }
      });

      if (categoryScore > 0) {
        score += Math.min(categoryScore, config.weight * 1.5); // Cap individual category contributions
        reasons.push(`Found ${category} VOSE indicators (score: +${categoryScore.toFixed(2)})`);
      }
    });

    return score;
  }

  private analyzeDubbedPatterns(
    text: string,
    rawMatches: any,
    reasons: string[],
    debugInfo?: any
  ): number {
    let score = 0;

    Object.entries(this.DUBBED_PATTERNS).forEach(([category, config]) => {
      let categoryScore = 0;

      config.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          categoryScore += config.weight;
          rawMatches.dubbedIndicators.push(...matches);

          if (debugInfo) {
            debugInfo.scoreBreakdown[`dubbed_${category}`] = (debugInfo.scoreBreakdown[`dubbed_${category}`] || 0) + config.weight;
            debugInfo.matchedPatterns.push(`DUBBED-${category}: ${pattern}`);
          }
        }
      });

      if (categoryScore < 0) {
        score += categoryScore;
        reasons.push(`Found ${category} dubbed indicators (score: ${categoryScore.toFixed(2)})`);
      }
    });

    return score;
  }

  private analyzeCinema(
    cinema: Cinema | undefined,
    url: string | undefined,
    text: string,
    reasons: string[],
    debugInfo?: any
  ): number {
    let cinemaBonus = 0;

    // Direct cinema object analysis
    if (cinema) {
      switch (cinema.voseSupport) {
        case 'specialist':
          cinemaBonus += 0.8;
          reasons.push(`Cinema ${cinema.name} specializes in VOSE (bonus: +0.8)`);
          break;
        case 'frequent':
          cinemaBonus += 0.3;
          reasons.push(`Cinema ${cinema.name} frequently shows VOSE (bonus: +0.3)`);
          break;
        case 'occasional':
          cinemaBonus += 0.1;
          reasons.push(`Cinema ${cinema.name} occasionally shows VOSE (bonus: +0.1)`);
          break;
        case 'rare':
          cinemaBonus -= 0.1;
          reasons.push(`Cinema ${cinema.name} rarely shows VOSE (penalty: -0.1)`);
          break;
      }
    }

    // Pattern-based cinema detection from URL and text
    const searchText = `${text} ${url || ''}`.toLowerCase();

    Object.entries(this.CINEMA_PATTERNS).forEach(([chainName, config]) => {
      let chainDetected = false;

      // Check if this cinema chain is mentioned
      config.patterns.forEach(pattern => {
        if (pattern.test(searchText)) {
          chainDetected = true;
        }
      });

      if (chainDetected) {
        let chainBonus = config.baseBonus;

        // Check for VOSE-specific markers for this chain
        if (config.voseMarkers) {
          config.voseMarkers.forEach(marker => {
            if (marker.test(searchText)) {
              chainBonus += 0.2;
              reasons.push(`${chainName} VOSE-specific marker found (bonus: +0.2)`);
            }
          });
        }

        cinemaBonus += chainBonus;
        reasons.push(`${chainName} detected (${config.voseSpecialist ? 'specialist' : config.voseSupport}) (bonus: +${chainBonus.toFixed(2)})`);

        if (debugInfo) {
          debugInfo.scoreBreakdown[`cinema_${chainName}`] = chainBonus;
        }
      }
    });

    return cinemaBonus;
  }

  private analyzeTimePatterns(
    text: string,
    rawMatches: any,
    reasons: string[],
    debugInfo?: any
  ): number {
    let score = 0;

    Object.entries(this.TIME_PATTERNS).forEach(([category, config]) => {
      config.patterns.forEach(pattern => {
        const matches = Array.from(text.matchAll(pattern));
        if (matches.length > 0) {
          const timeScore = config.weight * matches.length;
          score += timeScore;

          rawMatches.timePatterns.push(...matches.map(m => m[0]));
          reasons.push(`Time patterns suggest ${category} (${matches.length} matches, score: ${timeScore > 0 ? '+' : ''}${timeScore.toFixed(2)})`);

          if (debugInfo) {
            debugInfo.scoreBreakdown[`time_${category}`] = timeScore;
          }
        }
      });
    });

    return score;
  }

  private analyzeRegionalContext(
    searchText: string,
    reasons: string[],
    debugInfo?: any
  ): number {
    let score = 0;

    Object.entries(this.REGIONAL_PATTERNS).forEach(([region, config]) => {
      config.patterns.forEach(pattern => {
        if (pattern.test(searchText)) {
          score += config.weight;
          reasons.push(`Regional context (${region}) favors VOSE (bonus: +${config.weight.toFixed(2)})`);

          if (debugInfo) {
            debugInfo.scoreBreakdown[`region_${region}`] = config.weight;
          }
        }
      });
    });

    return score;
  }

  private analyzeMovieTitle(title: string, reasons: string[], debugInfo?: any): number {
    const normalizedTitle = title.toLowerCase();
    let score = 0;

    // English title indicators
    const englishWords = ['the', 'and', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'is', 'are', 'was', 'were'];
    const englishWordCount = englishWords.filter(word =>
      new RegExp(`\\b${word}\\b`, 'i').test(normalizedTitle)
    ).length;

    if (englishWordCount >= 2) {
      score += 0.3;
      reasons.push(`Movie title contains English words indicating original language (score: +0.3)`);
    }

    // Non-Spanish character patterns
    if (/[^a-záéíóúüñ\s\d\-'.,!?()]/.test(normalizedTitle)) {
      score += 0.15;
      reasons.push(`Movie title contains non-Spanish characters (score: +0.15)`);
    }

    if (debugInfo && score > 0) {
      debugInfo.scoreBreakdown['movie_title'] = score;
    }

    return score;
  }

  private resolveConflicts(
    text: string,
    rawMatches: any,
    reasons: string[],
    debugInfo?: any
  ): number {
    let coherenceScore = 0;

    const hasVOSE = rawMatches.voseIndicators.length > 0;
    const hasDubbed = rawMatches.dubbedIndicators.length > 0;

    if (hasVOSE && hasDubbed) {
      // Conflict resolution logic
      const voseStrength = rawMatches.voseIndicators.length;
      const dubbedStrength = rawMatches.dubbedIndicators.length;

      if (voseStrength > dubbedStrength * 1.5) {
        coherenceScore += 0.1;
        reasons.push(`Conflict resolved in favor of VOSE (stronger indicators)`);
        if (debugInfo) {
          debugInfo.conflictResolution.push(`VOSE wins: ${voseStrength} vs ${dubbedStrength} indicators`);
        }
      } else if (dubbedStrength > voseStrength * 1.5) {
        coherenceScore -= 0.15;
        reasons.push(`Conflict resolved against VOSE (stronger dubbed indicators)`);
        if (debugInfo) {
          debugInfo.conflictResolution.push(`Dubbed wins: ${dubbedStrength} vs ${voseStrength} indicators`);
        }
      } else {
        coherenceScore -= 0.2;
        reasons.push(`Conflicting indicators detected - reduced confidence`);
        if (debugInfo) {
          debugInfo.conflictResolution.push(`Inconclusive conflict: ${voseStrength} VOSE vs ${dubbedStrength} dubbed`);
        }
      }
    }

    if (debugInfo && coherenceScore !== 0) {
      debugInfo.scoreBreakdown['conflict_resolution'] = coherenceScore;
    }

    return coherenceScore;
  }

  private calculateFinalConfidence(totalScore: number, rawMatches: any): number {
    // Apply sigmoid-like function for smooth confidence scaling
    let confidence = 1 / (1 + Math.exp(-totalScore * 2));

    // Additional confidence boost for multiple strong indicators
    if (rawMatches.voseIndicators.length >= 3) {
      confidence = Math.min(1, confidence + 0.1);
    }

    // Confidence penalty for very few indicators
    if (rawMatches.voseIndicators.length === 0 && rawMatches.dubbedIndicators.length === 0) {
      confidence = Math.max(0.2, confidence * 0.5);
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private determineLanguage(rawMatches: any, confidence: number): 'VOSE' | 'Spanish' | 'Catalan' | 'Other' | 'Unknown' {
    if (confidence > 0.7 && rawMatches.voseIndicators.length > 0) {
      return 'VOSE';
    }

    if (rawMatches.dubbedIndicators.some((indicator: string) =>
      /castellano|español/i.test(indicator))) {
      return 'Spanish';
    }

    if (rawMatches.languageIndicators.some((indicator: string) =>
      /català|catalan/i.test(indicator))) {
      return 'Catalan';
    }

    if (confidence > 0.5) {
      return 'VOSE';
    }

    if (confidence < 0.3) {
      return 'Spanish';
    }

    return 'Unknown';
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Batch processing method
  detectBatch(
    items: Array<{
      text: string;
      cinema?: Cinema;
      movieTitle?: string;
      url?: string;
    }>,
    enableDebug: boolean = false
  ): EnhancedVOSEDetectionResult[] {
    return items.map(item =>
      this.detectVOSE(item.text, item.cinema, item.movieTitle, item.url, enableDebug)
    );
  }

  // Get recommended confidence threshold based on use case
  getRecommendedThreshold(useCase: 'strict' | 'balanced' | 'permissive' | 'experimental'): number {
    switch (useCase) {
      case 'strict':
        return 0.85;
      case 'balanced':
        return 0.6;
      case 'permissive':
        return 0.4;
      case 'experimental':
        return 0.3;
      default:
        return 0.6;
    }
  }
}