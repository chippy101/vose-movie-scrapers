import { BaseScraper, ScrapingResult } from './BaseScraper';
import { ScrapedShowtime, ScrapedCinema } from '../../../types/Cinema';
import { VOSEDetector } from '../detectors/VOSEDetector';

/**
 * Cines Moix Negre Scraper
 *
 * Independent cinema in Menorca
 * Website: http://www.cinesmoixnegre.org/
 * Shows mix of dubbed and original version films
 */
export class CinesMoixNegreScraper extends BaseScraper {
  private readonly baseUrl = 'http://www.cinesmoixnegre.org';
  private readonly voseDetector = new VOSEDetector();

  constructor() {
    super('CinesMoixNegre', {
      rateLimit: 2000,
      maxRetries: 3,
      timeout: 15000
    });
  }

  async scrapeShowtimes(): Promise<ScrapingResult<ScrapedShowtime>> {
    const errors: string[] = [];
    const showtimes: ScrapedShowtime[] = [];

    try {
      console.log(`[Moix Negre] Starting scrape for Menorca cinema`);

      // Scrape main page
      console.log(`[Moix Negre] Fetching: ${this.baseUrl}`);

      const html = await this.fetchWithRetry(this.baseUrl);
      const parsedShowtimes = this.parseMoviesPage(html);

      showtimes.push(...parsedShowtimes);
      console.log(`[Moix Negre] Found ${parsedShowtimes.length} showtimes`);

    } catch (error) {
      const errorMsg = `Failed to scrape Cines Moix Negre: ${error}`;
      console.error(`[Moix Negre] ${errorMsg}`);
      errors.push(errorMsg);
    }

    return this.createScrapingResult(showtimes, errors);
  }

  /**
   * Parse the Moix Negre movies page
   */
  private parseMoviesPage(html: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie blocks
      const movieBlocks = this.extractMoixNegreMovieBlocks(html);

      for (const block of movieBlocks) {
        const parsedShowtimes = this.parseMoixNegreMovieBlock(block);
        showtimes.push(...parsedShowtimes);
      }

    } catch (error) {
      console.error(`[Moix Negre] Failed to parse movies page: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract movie blocks from HTML
   */
  private extractMoixNegreMovieBlocks(html: string): string[] {
    const blocks: string[] = [];

    console.log('\n🔍 [Moix Negre] Extracting movie blocks');
    console.log(`[Moix Negre] HTML length: ${html.length} characters`);
    console.log(`[Moix Negre] HTML snippet (first 500 chars): ${html.substring(0, 500)}`);

    const patterns = [
      /<div[^>]*class[^>]*movie[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class[^>]*film[^>]*>(.*?)<\/div>/gis,
      /<article[^>]*>(.*?)<\/article>/gis,
      /<div[^>]*class[^>]*cartelera[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class[^>]*pelicula[^>]*>(.*?)<\/section>/gis
    ];

    patterns.forEach((pattern, idx) => {
      console.log(`[Moix Negre] Trying pattern ${idx + 1}: ${pattern.source.substring(0, 50)}...`);
      let match;
      let matchCount = 0;
      while ((match = pattern.exec(html)) !== null) {
        matchCount++;
        const content = match[1]?.trim();
        if (content && content.length > 50 && this.containsMovieInfo(content)) {
          blocks.push(content);
          if (blocks.length <= 3) {
            console.log(`[Moix Negre] Block ${blocks.length} snippet:`, content.substring(0, 200));
          }
        }
      }
      console.log(`[Moix Negre] Pattern ${idx + 1} found ${matchCount} matches, ${blocks.length} valid blocks so far`);
    });

    // If no structured blocks found, try paragraph-based parsing
    if (blocks.length === 0) {
      console.log('[Moix Negre] No structured blocks found, trying paragraph-based parsing...');
      const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
      console.log(`[Moix Negre] Found ${paragraphs.length} paragraphs`);

      paragraphs.forEach(p => {
        if (this.containsMovieInfo(p)) {
          blocks.push(p);
          if (blocks.length <= 3) {
            console.log(`[Moix Negre] Paragraph block ${blocks.length}:`, p.substring(0, 200));
          }
        }
      });
    }

    console.log(`[Moix Negre] Total extracted: ${blocks.length} movie blocks`);

    return blocks;
  }

  /**
   * Check if content contains movie information
   */
  private containsMovieInfo(content: string): boolean {
    const indicators = [
      /\d{1,2}:\d{2}/,  // Time format
      /VOSE|V\.O\.S\.E|Original|Subtitulada/i,
      /película|film|movie/i,
      /doblada|española/i,
      /sala|screen|theatre/i
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  /**
   * Parse a Moix Negre movie block
   */
  private parseMoixNegreMovieBlock(block: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie metadata
      const movieTitle = this.extractMoixNegreTitle(block);
      const posterUrl = this.extractMoixNegrePoster(block);
      const duration = this.extractDuration(block);
      const genre = this.extractGenre(block);

      // Extract showtimes
      const times = this.extractTimes(block);
      const versionInfo = this.extractVersionInfo(block);

      // Apply VOSE detection with debug enabled
      const voseResult = this.voseDetector.detectVOSE(
        `${block} ${versionInfo}`,
        undefined,
        movieTitle,
        true // Enable debug logging
      );

      // Only include VOSE showtimes (this cinema shows both dubbed and original)
      if (voseResult.isVOSE && voseResult.confidence > 0.4) {
        times.forEach(timeStr => {
          const time = this.parseTime(timeStr);
          if (time) {
            const startTime = new Date();
            startTime.setHours(time.hour, time.minute, 0, 0);

            showtimes.push({
              movieTitle,
              cinemaName: 'Cines Moix Negre',
              startTime,
              language: voseResult.detectedLanguage,
              isVOSE: true,
              confidence: voseResult.confidence,
              source: this.source,
              rawText: block,
              posterUrl,
              duration,
              genre,
              verificationStatus: voseResult.confidence > 0.7 ? 'confirmed' : 'pending',
              scrapedAt: new Date(),
              metadata: {
                island: 'Menorca',
                city: 'Ciutadella'
              }
            });
          }
        });
      }

    } catch (error) {
      console.error(`[Moix Negre] Failed to parse movie block: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract movie title
   */
  private extractMoixNegreTitle(block: string): string {
    const titlePatterns = [
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
      /<strong>([^<]+)<\/strong>/i,
      /<b>([^<]+)<\/b>/i,
      /^([^-–—\n]{3,60}?)(?:\s*[-–—]\s*|$)/,
      /"title":\s*"([^"]+)"/
    ];

    for (const pattern of titlePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 2 && !title.includes('http') && !title.includes('www')) {
          return title;
        }
      }
    }

    return 'Unknown Movie';
  }

  /**
   * Extract poster URL
   */
  private extractMoixNegrePoster(block: string): string | undefined {
    const posterPatterns = [
      /<img[^>]*src="([^"]*)"/i,
      /<img[^>]*data-src="([^"]*)"/i
    ];

    for (const pattern of posterPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        let url = match[1];
        if (!url.startsWith('http')) {
          url = `${this.baseUrl}${url}`;
        }
        return url;
      }
    }

    return undefined;
  }

  /**
   * Extract duration
   */
  private extractDuration(block: string): number | undefined {
    const durationPatterns = [
      /(\d+)\s*min(?:utos?|utes?)?/i,
      /duración[^>]*(\d+)/i,
      /duration[^>]*(\d+)/i
    ];

    for (const pattern of durationPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Extract genre
   */
  private extractGenre(block: string): string | undefined {
    const genrePatterns = [
      /género[^>]*>([^<]+)</i,
      /genre[^>]*>([^<]+)</i,
      /(drama|comedia|acción|thriller|terror|ciencia ficción|animación)/i
    ];

    for (const pattern of genrePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract times from block
   */
  private extractTimes(block: string): string[] {
    const times: string[] = [];
    const timePattern = /(\d{1,2}:\d{2})/g;
    let match;

    while ((match = timePattern.exec(block)) !== null) {
      const timeStr = match[1];
      if (timeStr) {
        times.push(timeStr);
      }
    }

    return [...new Set(times)];
  }

  /**
   * Extract version information
   */
  private extractVersionInfo(block: string): string {
    const versionPatterns = [
      /VOSE|V\.O\.S\.E|Original|Subtitulada|Doblada|Español/gi,
      /versión original/gi,
      /subtítulos en español/gi,
      /versión española/gi
    ];

    const versions: string[] = [];
    versionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(block)) !== null) {
        if (match[0]) {
          versions.push(match[0]);
        }
      }
    });

    return versions.join(' ');
  }

  /**
   * Scrape cinema information
   */
  async scrapeCinemas(): Promise<ScrapingResult<ScrapedCinema>> {
    const errors: string[] = [];
    const cinemas: ScrapedCinema[] = [];

    try {
      console.log(`[Moix Negre] Scraping cinema information`);

      cinemas.push({
        name: 'Cines Moix Negre',
        chain: 'Independent',
        location: {
          lat: 40.0019,
          lng: 3.8371,
          address: 'Ciutadella',
          city: 'Ciutadella',
          region: 'Menorca'
        },
        voseSupport: 'occasional', // Mixed programming
        contact: {
          website: 'http://www.cinesmoixnegre.org/'
        },
        source: this.source,
        lastUpdated: new Date().toISOString(),
        verificationStatus: 'verified',
        metadata: {
          island: 'Menorca',
          type: 'independent'
        }
      } as ScrapedCinema);

    } catch (error) {
      const errorMsg = `Failed to scrape Moix Negre cinema info: ${error}`;
      errors.push(errorMsg);
    }

    return this.createScrapingResult(cinemas, errors);
  }
}
