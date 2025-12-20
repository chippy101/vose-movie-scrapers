import { ScrapedShowtime, VOSEShowtime, Cinema } from '../../types/Cinema';
import { EnhancedVOSEDetector } from '../scraping/detectors/EnhancedVOSEDetector';

export interface ValidationRule {
  name: string;
  severity: 'error' | 'warning' | 'info';
  validate: (showtime: ScrapedShowtime, context?: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  allShowtimes: ScrapedShowtime[];
  cinemas: Cinema[];
  movieTitles: string[];
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
  metadata: Record<string, any>;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestedFix?: string;
}

export interface ValidationReport {
  totalShowtimes: number;
  validShowtimes: number;
  invalidShowtimes: number;
  warningCount: number;
  errorCount: number;
  infoCount: number;
  averageConfidence: number;
  validationRules: string[];
  issueBreakdown: Record<string, number>;
  recommendations: string[];
  performanceMetrics: {
    validationDuration: number;
    averageTimePerShowtime: number;
  };
}

export class DataValidationSystem {
  private voseDetector: EnhancedVOSEDetector;
  private validationRules: ValidationRule[];

  constructor() {
    this.voseDetector = new EnhancedVOSEDetector();
    this.validationRules = this.createValidationRules();
  }

  /**
   * Validate a collection of showtimes
   */
  async validateShowtimes(
    showtimes: ScrapedShowtime[],
    context?: Partial<ValidationContext>
  ): Promise<{
    validatedShowtimes: ScrapedShowtime[];
    report: ValidationReport;
  }> {
    const startTime = Date.now();

    const validationContext: ValidationContext = {
      allShowtimes: showtimes,
      cinemas: context?.cinemas || [],
      movieTitles: context?.movieTitles || [],
      timeWindow: context?.timeWindow || {
        start: new Date(),
        end: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)) // 2 weeks from now
      }
    };

    const validatedShowtimes: ScrapedShowtime[] = [];
    const allIssues: ValidationIssue[] = [];
    let totalConfidence = 0;

    // Validate each showtime
    for (const showtime of showtimes) {
      const validationResult = await this.validateSingleShowtime(showtime, validationContext);

      // Apply validation result to showtime
      const validatedShowtime = {
        ...showtime,
        confidence: Math.min(showtime.confidence, validationResult.confidence),
        verificationStatus: this.determineVerificationStatus(validationResult)
      };

      validatedShowtimes.push(validatedShowtime);
      allIssues.push(...validationResult.issues);
      totalConfidence += validationResult.confidence;
    }

    // Generate report
    const report = this.generateValidationReport(
      showtimes,
      validatedShowtimes,
      allIssues,
      totalConfidence / showtimes.length,
      Date.now() - startTime
    );

    return {
      validatedShowtimes,
      report
    };
  }

  /**
   * Validate a single showtime against all rules
   */
  private async validateSingleShowtime(
    showtime: ScrapedShowtime,
    context: ValidationContext
  ): Promise<ValidationResult> {
    let overallConfidence = 1.0;
    const allIssues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    const metadata: Record<string, any> = {};

    // Apply each validation rule
    for (const rule of this.validationRules) {
      try {
        const result = rule.validate(showtime, context);

        if (!result.isValid) {
          allIssues.push(...result.issues);

          // Reduce confidence based on severity
          const confidencePenalty = this.getConfidencePenalty(result.issues);
          overallConfidence = Math.max(0, overallConfidence - confidencePenalty);
        }

        suggestions.push(...result.suggestions);
        Object.assign(metadata, result.metadata);

      } catch (error) {
        console.error(`Validation rule '${rule.name}' failed:`, error);
        allIssues.push({
          severity: 'warning',
          code: 'RULE_EXECUTION_ERROR',
          message: `Validation rule '${rule.name}' failed to execute`,
          suggestedFix: 'Review validation rule implementation'
        });
      }
    }

    return {
      isValid: allIssues.filter(issue => issue.severity === 'error').length === 0,
      confidence: overallConfidence,
      issues: allIssues,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      metadata
    };
  }

  /**
   * Create all validation rules
   */
  private createValidationRules(): ValidationRule[] {
    return [
      // Basic data integrity rules
      {
        name: 'Required Fields',
        severity: 'error',
        validate: (showtime) => {
          const issues: ValidationIssue[] = [];

          if (!showtime.movieTitle || showtime.movieTitle.trim().length < 2) {
            issues.push({
              severity: 'error',
              code: 'MISSING_MOVIE_TITLE',
              message: 'Movie title is missing or too short',
              field: 'movieTitle',
              suggestedFix: 'Ensure movie title extraction is working correctly'
            });
          }

          if (!showtime.cinemaName || showtime.cinemaName.trim().length < 3) {
            issues.push({
              severity: 'error',
              code: 'MISSING_CINEMA_NAME',
              message: 'Cinema name is missing or too short',
              field: 'cinemaName',
              suggestedFix: 'Verify cinema name extraction logic'
            });
          }

          if (!showtime.startTime || isNaN(showtime.startTime.getTime())) {
            issues.push({
              severity: 'error',
              code: 'INVALID_START_TIME',
              message: 'Start time is missing or invalid',
              field: 'startTime',
              suggestedFix: 'Check date parsing logic'
            });
          }

          return {
            isValid: issues.length === 0,
            confidence: issues.length === 0 ? 1.0 : 0.2,
            issues,
            suggestions: issues.length > 0 ? ['Review data extraction patterns'] : [],
            metadata: { requiredFieldsValid: issues.length === 0 }
          };
        }
      },

      // Time validation rules
      {
        name: 'Time Range Validation',
        severity: 'warning',
        validate: (showtime, context) => {
          const issues: ValidationIssue[] = [];
          const now = new Date();

          if (showtime.startTime) {
            // Check if showtime is too far in the past
            const maxPastHours = 6;
            const minTime = new Date(now.getTime() - (maxPastHours * 60 * 60 * 1000));

            if (showtime.startTime < minTime) {
              issues.push({
                severity: 'warning',
                code: 'SHOWTIME_TOO_OLD',
                message: `Showtime is ${Math.round((now.getTime() - showtime.startTime.getTime()) / (60 * 60 * 1000))} hours in the past`,
                field: 'startTime',
                suggestedFix: 'Consider removing or flagging old showtimes'
              });
            }

            // Check if showtime is too far in the future
            const maxFutureWeeks = 4;
            const maxTime = new Date(now.getTime() + (maxFutureWeeks * 7 * 24 * 60 * 60 * 1000));

            if (showtime.startTime > maxTime) {
              issues.push({
                severity: 'warning',
                code: 'SHOWTIME_TOO_FUTURE',
                message: `Showtime is more than ${maxFutureWeeks} weeks in the future`,
                field: 'startTime',
                suggestedFix: 'Verify date parsing accuracy'
              });
            }

            // Check for reasonable cinema hours (6 AM to 2 AM)
            const hour = showtime.startTime.getHours();
            if (hour < 6 && hour > 2) {
              issues.push({
                severity: 'info',
                code: 'UNUSUAL_SHOWTIME_HOUR',
                message: `Unusual showtime hour: ${hour}:00`,
                field: 'startTime',
                suggestedFix: 'Verify this is a real showtime'
              });
            }
          }

          return {
            isValid: issues.filter(i => i.severity === 'error').length === 0,
            confidence: issues.length === 0 ? 1.0 : 0.8,
            issues,
            suggestions: [],
            metadata: { timeRangeValid: issues.length === 0 }
          };
        }
      },

      // VOSE detection validation
      {
        name: 'VOSE Detection Quality',
        severity: 'info',
        validate: (showtime) => {
          const issues: ValidationIssue[] = [];
          const suggestions: string[] = [];

          // Re-validate VOSE detection
          const reValidation = this.voseDetector.detectVOSE(
            showtime.rawText,
            undefined,
            showtime.movieTitle,
            undefined,
            true // Enable debug
          );

          // Check confidence consistency
          const confidenceDiff = Math.abs(showtime.confidence - reValidation.confidence);
          if (confidenceDiff > 0.2) {
            issues.push({
              severity: 'info',
              code: 'VOSE_CONFIDENCE_INCONSISTENT',
              message: `VOSE confidence differs on re-validation: ${showtime.confidence.toFixed(2)} vs ${reValidation.confidence.toFixed(2)}`,
              suggestedFix: 'Review VOSE detection algorithm'
            });
          }

          // Check for conflicting indicators
          if (reValidation.rawMatches.voseIndicators.length > 0 &&
              reValidation.rawMatches.dubbedIndicators.length > 0) {
            issues.push({
              severity: 'warning',
              code: 'CONFLICTING_LANGUAGE_INDICATORS',
              message: 'Both VOSE and dubbed indicators found',
              suggestedFix: 'Manual verification recommended'
            });
            suggestions.push('Flag for manual review due to conflicting language indicators');
          }

          // Check confidence level appropriateness
          if (showtime.isVOSE && showtime.confidence < 0.6) {
            suggestions.push('Low confidence VOSE detection - consider additional validation');
          }

          return {
            isValid: true,
            confidence: Math.max(0.5, 1.0 - (confidenceDiff * 2)),
            issues,
            suggestions,
            metadata: {
              revalidatedVOSE: reValidation.isVOSE,
              revalidatedConfidence: reValidation.confidence,
              voseQualityScore: 1.0 - confidenceDiff
            }
          };
        }
      },

      // Duplicate detection
      {
        name: 'Duplicate Detection',
        severity: 'warning',
        validate: (showtime, context) => {
          const issues: ValidationIssue[] = [];

          if (context) {
            const duplicates = context.allShowtimes.filter(other =>
              other !== showtime &&
              other.movieTitle.toLowerCase().trim() === showtime.movieTitle.toLowerCase().trim() &&
              other.cinemaName.toLowerCase().trim() === showtime.cinemaName.toLowerCase().trim() &&
              Math.abs(other.startTime.getTime() - showtime.startTime.getTime()) < 60000 // Within 1 minute
            );

            if (duplicates.length > 0) {
              issues.push({
                severity: 'warning',
                code: 'POTENTIAL_DUPLICATE',
                message: `Found ${duplicates.length} potential duplicate(s)`,
                suggestedFix: 'Remove duplicate entries, keeping the one with highest confidence'
              });
            }
          }

          return {
            isValid: issues.length === 0,
            confidence: issues.length === 0 ? 1.0 : 0.7,
            issues,
            suggestions: [],
            metadata: { isDuplicate: issues.length > 0 }
          };
        }
      },

      // Movie title quality
      {
        name: 'Movie Title Quality',
        severity: 'info',
        validate: (showtime) => {
          const issues: ValidationIssue[] = [];
          const suggestions: string[] = [];

          const title = showtime.movieTitle.trim();

          // Check for generic or placeholder titles
          const genericTitles = [
            'unknown movie', 'untitled', 'película', 'film',
            'movie', 'test', 'example', 'sample'
          ];

          if (genericTitles.some(generic => title.toLowerCase().includes(generic))) {
            issues.push({
              severity: 'warning',
              code: 'GENERIC_MOVIE_TITLE',
              message: 'Movie title appears to be generic or placeholder',
              field: 'movieTitle',
              suggestedFix: 'Improve title extraction logic'
            });
          }

          // Check for overly long titles (might be corrupted data)
          if (title.length > 100) {
            issues.push({
              severity: 'warning',
              code: 'TITLE_TOO_LONG',
              message: `Movie title is unusually long (${title.length} characters)`,
              field: 'movieTitle',
              suggestedFix: 'Verify title extraction boundaries'
            });
          }

          // Check for titles with excessive special characters
          const specialCharRatio = (title.match(/[^a-zA-Z0-9\s]/g) || []).length / title.length;
          if (specialCharRatio > 0.3) {
            issues.push({
              severity: 'info',
              code: 'HIGH_SPECIAL_CHAR_RATIO',
              message: 'Movie title has high ratio of special characters',
              field: 'movieTitle'
            });
          }

          return {
            isValid: issues.filter(i => i.severity === 'error').length === 0,
            confidence: issues.length === 0 ? 1.0 : 0.8,
            issues,
            suggestions,
            metadata: {
              titleLength: title.length,
              specialCharRatio,
              titleQualityScore: Math.max(0.5, 1.0 - (issues.length * 0.2))
            }
          };
        }
      },

      // Source reliability
      {
        name: 'Source Reliability',
        severity: 'info',
        validate: (showtime) => {
          const issues: ValidationIssue[] = [];
          const suggestions: string[] = [];

          // Rate source reliability
          const sourceReliability = this.getSourceReliability(showtime.source);

          if (sourceReliability < 0.7) {
            suggestions.push(`Source '${showtime.source}' has lower reliability - consider additional verification`);
          }

          // Check raw text quality
          if (!showtime.rawText || showtime.rawText.trim().length < 20) {
            issues.push({
              severity: 'info',
              code: 'INSUFFICIENT_RAW_TEXT',
              message: 'Raw text data is minimal, affecting validation quality',
              suggestedFix: 'Capture more context during scraping'
            });
          }

          return {
            isValid: true,
            confidence: sourceReliability,
            issues,
            suggestions,
            metadata: {
              sourceReliability,
              rawTextLength: showtime.rawText?.length || 0
            }
          };
        }
      }
    ];
  }

  /**
   * Get source reliability score
   */
  private getSourceReliability(source: string): number {
    const reliability: Record<string, number> = {
      'Cinesa': 0.85,
      'Yelmo': 0.8,
      'Kinépolis': 0.82,
      'CineCiutat': 0.95, // Specialist cinema, very reliable
      'MajorcaDailyBulletin': 0.75,
      'EuroWeeklyNews': 0.7,
      'Ocimax': 0.75,
      'Manual': 0.95
    };

    return reliability[source] || 0.6; // Default reliability for unknown sources
  }

  /**
   * Calculate confidence penalty based on issues
   */
  private getConfidencePenalty(issues: ValidationIssue[]): number {
    let penalty = 0;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          penalty += 0.3;
          break;
        case 'warning':
          penalty += 0.1;
          break;
        case 'info':
          penalty += 0.05;
          break;
      }
    }

    return Math.min(0.8, penalty); // Cap penalty at 0.8
  }

  /**
   * Determine verification status based on validation result
   */
  private determineVerificationStatus(result: ValidationResult): 'pending' | 'confirmed' | 'rejected' | 'expired' {
    const hasErrors = result.issues.some(issue => issue.severity === 'error');
    const hasWarnings = result.issues.some(issue => issue.severity === 'warning');

    if (hasErrors) {
      return 'rejected';
    }

    if (result.confidence > 0.8 && !hasWarnings) {
      return 'confirmed';
    }

    return 'pending';
  }

  /**
   * Generate validation report
   */
  private generateValidationReport(
    originalShowtimes: ScrapedShowtime[],
    validatedShowtimes: ScrapedShowtime[],
    allIssues: ValidationIssue[],
    averageConfidence: number,
    validationDuration: number
  ): ValidationReport {
    const errorCount = allIssues.filter(issue => issue.severity === 'error').length;
    const warningCount = allIssues.filter(issue => issue.severity === 'warning').length;
    const infoCount = allIssues.filter(issue => issue.severity === 'info').length;

    const validShowtimes = validatedShowtimes.filter(st =>
      st.verificationStatus === 'confirmed' || st.verificationStatus === 'pending'
    ).length;

    const invalidShowtimes = originalShowtimes.length - validShowtimes;

    // Count issues by code
    const issueBreakdown: Record<string, number> = {};
    allIssues.forEach(issue => {
      issueBreakdown[issue.code] = (issueBreakdown[issue.code] || 0) + 1;
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (errorCount > originalShowtimes.length * 0.1) {
      recommendations.push('High error rate detected - review data extraction logic');
    }

    if (averageConfidence < 0.7) {
      recommendations.push('Low average confidence - consider improving VOSE detection');
    }

    if (validationDuration > 5000) {
      recommendations.push('Validation taking too long - optimize validation rules');
    }

    const topIssues = Object.entries(issueBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([code]) => code);

    if (topIssues.length > 0) {
      recommendations.push(`Most common issues: ${topIssues.join(', ')}`);
    }

    return {
      totalShowtimes: originalShowtimes.length,
      validShowtimes,
      invalidShowtimes,
      warningCount,
      errorCount,
      infoCount,
      averageConfidence,
      validationRules: this.validationRules.map(rule => rule.name),
      issueBreakdown,
      recommendations,
      performanceMetrics: {
        validationDuration,
        averageTimePerShowtime: validationDuration / originalShowtimes.length
      }
    };
  }

  /**
   * Validate specific fields
   */
  async validateField(
    showtime: ScrapedShowtime,
    fieldName: keyof ScrapedShowtime,
    value: any
  ): Promise<ValidationResult> {
    // Field-specific validation logic
    const issues: ValidationIssue[] = [];

    switch (fieldName) {
      case 'movieTitle':
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
          issues.push({
            severity: 'error',
            code: 'INVALID_MOVIE_TITLE',
            message: 'Invalid movie title',
            field: fieldName
          });
        }
        break;

      case 'startTime':
        if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
          issues.push({
            severity: 'error',
            code: 'INVALID_START_TIME',
            message: 'Invalid start time',
            field: fieldName
          });
        }
        break;

      case 'confidence':
        if (typeof value !== 'number' || value < 0 || value > 1) {
          issues.push({
            severity: 'error',
            code: 'INVALID_CONFIDENCE',
            message: 'Confidence must be a number between 0 and 1',
            field: fieldName
          });
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      confidence: issues.length === 0 ? 1.0 : 0.0,
      issues,
      suggestions: [],
      metadata: {}
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics(): {
    totalRules: number;
    rulesByCategory: Record<string, number>;
    averageValidationTime: number;
  } {
    const rulesByCategory: Record<string, number> = {
      error: this.validationRules.filter(r => r.severity === 'error').length,
      warning: this.validationRules.filter(r => r.severity === 'warning').length,
      info: this.validationRules.filter(r => r.severity === 'info').length
    };

    return {
      totalRules: this.validationRules.length,
      rulesByCategory,
      averageValidationTime: 0 // Would be calculated from actual runs
    };
  }
}