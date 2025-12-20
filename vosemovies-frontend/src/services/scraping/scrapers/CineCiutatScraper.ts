import { BaseScraper, ScrapingResult } from './BaseScraper';
import { ScrapedShowtime, ScrapedCinema } from '../../../types/Cinema';
import { VOSEDetector } from '../detectors/VOSEDetector';

/**
 * CineCiutat Scraper
 *
 * CineCiutat is an independent cinema cooperative in Palma, Mallorca
 * Specializes in original version films (VOSE/VO)
 * All movies shown in original language - this is a VOSE specialist cinema
 */
export class CineCiutatScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.cineciutat.org';
  private readonly voseDetector = new VOSEDetector();

  constructor() {
    super('CineCiutat', {
      rateLimit: 2000,
      maxRetries: 3,
      timeout: 15000
    });
  }

  async scrapeShowtimes(): Promise<ScrapingResult<ScrapedShowtime>> {
    const errors: string[] = [];
    const showtimes: ScrapedShowtime[] = [];

    try {
      console.log(`[CineCiutat] Starting scrape - VOSE specialist cinema`);

      // Scrape English version of the movies page
      const moviesUrl = `${this.baseUrl}/en/movies`;
      console.log(`[CineCiutat] Fetching: ${moviesUrl}`);

      const html = await this.fetchWithRetry(moviesUrl);
      const parsedShowtimes = this.parseMoviesPage(html);

      showtimes.push(...parsedShowtimes);
      console.log(`[CineCiutat] Found ${parsedShowtimes.length} showtimes`);

    } catch (error) {
      const errorMsg = `Failed to scrape CineCiutat: ${error}`;
      console.error(`[CineCiutat] ${errorMsg}`);
      errors.push(errorMsg);
    }

    return this.createScrapingResult(showtimes, errors);
  }

  /**
   * Parse the CineCiutat movies page
   */
  private parseMoviesPage(html: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie blocks from the page
      const movieBlocks = this.extractCineCiutatMovieBlocks(html);

      for (const block of movieBlocks) {
        const parsedShowtimes = this.parseCineCiutatMovieBlock(block);
        showtimes.push(...parsedShowtimes);
      }

    } catch (error) {
      console.error(`[CineCiutat] Failed to parse movies page: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract movie blocks from CineCiutat HTML
   */
  private extractCineCiutatMovieBlocks(html: string): string[] {
    const blocks: string[] = [];

    console.log('\n🔍 [CineCiutat] Extracting movie blocks');
    console.log(`[CineCiutat] HTML length: ${html.length} characters`);
    console.log(`[CineCiutat] HTML snippet (first 500 chars): ${html.substring(0, 500)}`);

    // CineCiutat specific patterns
    const patterns = [
      // Movie cards/containers
      /<div[^>]*class[^>]*movie[^>]*>(.*?)<\/div>/gis,
      /<article[^>]*class[^>]*film[^>]*>(.*?)<\/article>/gis,
      /<div[^>]*class[^>]*showtime[^>]*>(.*?)<\/div>/gis,
      // Card structures
      /<div[^>]*class[^>]*card[^>]*>(.*?)<\/div>/gis,
    ];

    patterns.forEach((pattern, idx) => {
      console.log(`[CineCiutat] Trying pattern ${idx + 1}: ${pattern.source.substring(0, 50)}...`);
      let match;
      let matchCount = 0;
      while ((match = pattern.exec(html)) !== null) {
        matchCount++;
        const content = match[1]?.trim();
        if (content && content.length > 100 && this.containsCineCiutatMovieInfo(content)) {
          blocks.push(content);
          if (blocks.length <= 3) { // Log first 3 for debugging
            console.log(`[CineCiutat] Block ${blocks.length} snippet:`, content.substring(0, 200));
          }
        }
      }
      console.log(`[CineCiutat] Pattern ${idx + 1} found ${matchCount} matches, ${blocks.length} valid blocks so far`);
    });

    console.log(`[CineCiutat] Total extracted: ${blocks.length} movie blocks`);

    if (blocks.length === 0) {
      console.log(`[CineCiutat] ⚠️ WARNING: No movie blocks found!`);
      console.log(`[CineCiutat] Checking for AJAX loading indicators...`);
      if (html.includes('data-request') || html.includes('onLoadMovies')) {
        console.log(`[CineCiutat] ✓ Page uses AJAX loading - movies are not in initial HTML`);
      }

      // Check for common class names
      console.log(`[CineCiutat] Looking for common class names in HTML...`);
      const classMatches = html.match(/class="([^"]+)"/g);
      if (classMatches) {
        const uniqueClasses = [...new Set(classMatches.slice(0, 20))];
        console.log(`[CineCiutat] Sample classes found:`, uniqueClasses.slice(0, 10));
      }
    }

    return blocks;
  }

  /**
   * Check if content contains CineCiutat movie information
   */
  private containsCineCiutatMovieInfo(content: string): boolean {
    const indicators = [
      /screen\s+\d+/i, // "Screen 2"
      /\d{1,2}:\d{2}/,  // Time format
      /laser|digital|sala/i, // Screen types
      /director/i,
      /runtime|duration|minutes/i,
      /reservaentradas\.com/i // Ticket booking system
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  /**
   * Parse a CineCiutat movie block
   */
  private parseCineCiutatMovieBlock(block: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie metadata
      const movieTitle = this.extractCineCiutatTitle(block);
      const posterUrl = this.extractCineCiutatPoster(block);
      const duration = this.extractCineCiutatDuration(block);
      const director = this.extractCineCiutatDirector(block);
      const genre = this.extractCineCiutatGenre(block);

      // Extract showtimes with screen info
      const sessions = this.extractCineCiutatSessions(block);

      // CineCiutat shows ALL movies in original version
      // Apply VOSE detection for confirmation with debug enabled
      const voseResult = this.voseDetector.detectVOSE(
        block,
        undefined,
        movieTitle,
        true // Enable debug logging
      );

      // Create showtime entries
      sessions.forEach(session => {
        // CineCiutat is a VOSE specialist - all movies are original version
        const isVOSE = true;
        const confidence = Math.max(0.9, voseResult.confidence); // High confidence baseline

        showtimes.push({
          movieTitle,
          cinemaName: 'CineCiutat',
          startTime: session.startTime,
          language: voseResult.detectedLanguage || 'VOSE',
          isVOSE,
          confidence,
          source: this.source,
          rawText: block,
          posterUrl,
          duration,
          genre,
          ticketUrl: session.ticketUrl,
          format: undefined, // CineCiutat doesn't specify standard format
          verificationStatus: 'confirmed', // CineCiutat is known VOSE specialist
          scrapedAt: new Date(),
          metadata: {
            island: 'Mallorca',
            city: 'Palma',
            director,
            screen: session.screen
          }
        });
      });

    } catch (error) {
      console.error(`[CineCiutat] Failed to parse movie block: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract movie title
   */
  private extractCineCiutatTitle(block: string): string {
    const titlePatterns = [
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
      /<a[^>]*href="[^"]*\/movie\/[^"]*"[^>]*>([^<]+)<\/a>/i,
      /<[^>]*class[^>]*title[^>]*>([^<]+)<\/[^>]*>/i,
      /"movieTitle":\s*"([^"]+)"/,
      /"name":\s*"([^"]+)"/
    ];

    for (const pattern of titlePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown Movie';
  }

  /**
   * Extract poster URL
   */
  private extractCineCiutatPoster(block: string): string | undefined {
    const posterPatterns = [
      /<img[^>]*src="([^"]*)"/i,
      /<img[^>]*data-src="([^"]*)"/i,
      /background-image:\s*url\(['"]([^'"]+)['"]\)/i
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
  private extractCineCiutatDuration(block: string): number | undefined {
    const durationPatterns = [
      /(\d+)\s*min(?:utes)?/i,
      /runtime[^>]*>(\d+)/i,
      /duration[^>]*>(\d+)/i
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
   * Extract director
   */
  private extractCineCiutatDirector(block: string): string | undefined {
    const directorPatterns = [
      /director[^>]*>([^<]+)</i,
      /directed by[^>]*>([^<]+)</i,
      /"director":\s*"([^"]+)"/
    ];

    for (const pattern of directorPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract genre
   */
  private extractCineCiutatGenre(block: string): string | undefined {
    const genrePatterns = [
      /genre[^>]*>([^<]+)</i,
      /<p[^>]*class[^>]*genre[^>]*>([^<]+)<\/p>/i,
      /"genre":\s*"([^"]+)"/
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
   * Extract sessions (showtimes with screen and ticket info)
   */
  private extractCineCiutatSessions(block: string): Array<{
    startTime: Date;
    screen?: string;
    ticketUrl?: string;
  }> {
    const sessions: Array<{ startTime: Date; screen?: string; ticketUrl?: string }> = [];

    // Look for showtime patterns with screen info
    // Format: "Screen 2 Laser", "18:35"
    const sessionPatterns = [
      /(screen\s+\d+[^>]*?)\s*(\d{1,2}:\d{2})/gi,
      /(sala\s+\d+[^>]*?)\s*(\d{1,2}:\d{2})/gi,
    ];

    sessionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(block)) !== null) {
        const screen = match[1]?.trim();
        const timeStr = match[2];

        const time = this.parseTime(timeStr);
        if (time) {
          const startTime = new Date();
          startTime.setHours(time.hour, time.minute, 0, 0);

          sessions.push({
            startTime,
            screen,
            ticketUrl: this.extractTicketUrlNearTime(block, timeStr)
          });
        }
      }
    });

    // If no screen info found, extract times directly
    if (sessions.length === 0) {
      const times = this.extractTimes(block);
      times.forEach(timeStr => {
        const time = this.parseTime(timeStr);
        if (time) {
          const startTime = new Date();
          startTime.setHours(time.hour, time.minute, 0, 0);

          sessions.push({
            startTime,
            ticketUrl: this.extractTicketUrlNearTime(block, timeStr)
          });
        }
      });
    }

    return sessions;
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

    return [...new Set(times)]; // Remove duplicates
  }

  /**
   * Extract ticket URL near a specific time
   */
  private extractTicketUrlNearTime(block: string, timeStr: string): string | undefined {
    // Look for reservaentradas.com links near the time
    const urlPattern = new RegExp(`${timeStr}[^>]*?href="([^"]*reservaentradas[^"]*)"`, 'i');
    const match = block.match(urlPattern);

    if (match && match[1]) {
      return match[1];
    }

    // Fallback: find any ticket URL in the block
    const ticketPatterns = [
      /href="([^"]*reservaentradas[^"]*)"/i,
      /href="([^"]*ticket[^"]*)"/i,
      /href="([^"]*entrada[^"]*)"/i
    ];

    for (const pattern of ticketPatterns) {
      const fallbackMatch = block.match(pattern);
      if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Scrape cinema information
   */
  async scrapeCinemas(): Promise<ScrapingResult<ScrapedCinema>> {
    const errors: string[] = [];
    const cinemas: ScrapedCinema[] = [];

    try {
      console.log(`[CineCiutat] Scraping cinema information`);

      cinemas.push({
        name: 'CineCiutat',
        chain: 'Independent',
        location: {
          lat: 39.5717,
          lng: 2.6510,
          address: "Carrer de l'Emperadriu Eugènia, 6",
          city: 'Palma',
          postalCode: '07010',
          region: 'Mallorca',
          district: 'Nord'
        },
        voseSupport: 'specialist', // ALL movies in original version
        contact: {
          phone: '971 205 453',
          email: 'contact@cineciutat.org',
          website: 'https://cineciutat.org/en'
        },
        features: {
          parking: false,
          restaurant: false
        },
        source: this.source,
        lastUpdated: new Date().toISOString(),
        verificationStatus: 'verified',
        metadata: {
          type: 'cooperative',
          specialization: 'original_version',
          island: 'Mallorca'
        }
      } as ScrapedCinema);

    } catch (error) {
      const errorMsg = `Failed to scrape CineCiutat cinema info: ${error}`;
      errors.push(errorMsg);
    }

    return this.createScrapingResult(cinemas, errors);
  }
}
