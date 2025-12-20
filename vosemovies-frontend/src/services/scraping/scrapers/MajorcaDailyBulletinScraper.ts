import { BaseScraper, ScrapingResult } from './BaseScraper';
import { ScrapedShowtime, ScrapedCinema } from '../../../types/Cinema';
import { VOSEDetector } from '../detectors/VOSEDetector';
import { BALEARIC_CINEMAS } from '../../../data/cinemas/balearicCinemas';

export class MajorcaDailyBulletinScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.majorcadailybulletin.com';
  private readonly voseDetector = new VOSEDetector();

  constructor() {
    super('MajorcaDailyBulletin', {
      rateLimit: 2000, // Be respectful to MDB servers
      maxRetries: 3,
      timeout: 15000
    });
  }

  async scrapeShowtimes(): Promise<ScrapingResult<ScrapedShowtime>> {
    const errors: string[] = [];
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Get the main films in English page
      const mainUrl = `${this.baseUrl}/tag/Films+in+English+in+Mallorca.html`;
      console.log(`[MDB] Scraping main films page: ${mainUrl}`);

      const mainHtml = await this.fetchWithRetry(mainUrl);

      // Extract links to individual weekly listings
      const weeklyLinks = this.extractWeeklyListingLinks(mainHtml);
      console.log(`[MDB] Found ${weeklyLinks.length} weekly listing links`);

      // Scrape each weekly listing
      for (const link of weeklyLinks.slice(0, 3)) { // Limit to most recent 3 weeks
        try {
          const weeklyShowtimes = await this.scrapeWeeklyListing(link);
          showtimes.push(...weeklyShowtimes);

          console.log(`[MDB] Scraped ${weeklyShowtimes.length} showtimes from ${link.url}`);
        } catch (error) {
          const errorMsg = `Failed to scrape weekly listing ${link.url}: ${error}`;
          console.error(`[MDB] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to scrape main MDB page: ${error}`;
      console.error(`[MDB] ${errorMsg}`);
      errors.push(errorMsg);
    }

    return this.createScrapingResult(showtimes, errors);
  }

  private extractWeeklyListingLinks(html: string): { text: string; url: string }[] {
    console.log('\n🔍 [MDB] Extracting weekly listing links');
    console.log(`[MDB] HTML length: ${html.length} characters`);
    console.log(`[MDB] HTML snippet (first 500 chars): ${html.substring(0, 500)}`);

    const links = this.extractLinks(html, this.baseUrl);
    console.log(`[MDB] Extracted ${links.length} total links from page`);

    // Log first 10 links for debugging
    if (links.length > 0) {
      console.log('[MDB] First 10 link texts:');
      links.slice(0, 10).forEach((link, idx) => {
        console.log(`  ${idx + 1}. "${link.text}"`);
      });
    }

    // Filter for weekly listing links (typically contain dates)
    const filtered = links.filter(link => {
      const text = link.text.toLowerCase();
      const matches = (
        text.includes('films in english') &&
        text.includes('mallorca') &&
        (text.includes('showtimes') || text.includes('to'))
      );
      if (matches) {
        console.log(`[MDB] ✓ Matched link: "${link.text}" -> ${link.url}`);
      }
      return matches;
    });

    console.log(`[MDB] Filtered to ${filtered.length} weekly listing links`);

    if (filtered.length === 0) {
      console.log('[MDB] ⚠️ No weekly listing links found. Trying alternative patterns...');

      // Try broader pattern
      const altFiltered = links.filter(link => {
        const text = link.text.toLowerCase();
        return text.includes('film') && text.includes('english');
      });

      console.log(`[MDB] Alternative pattern found ${altFiltered.length} links`);
      if (altFiltered.length > 0) {
        console.log('[MDB] Sample alternative matches:');
        altFiltered.slice(0, 5).forEach(link => {
          console.log(`  - "${link.text}" -> ${link.url}`);
        });
      }
    }

    return filtered.slice(0, 5); // Get most recent 5 listings
  }

  private async scrapeWeeklyListing(link: { text: string; url: string }): Promise<ScrapedShowtime[]> {
    const html = await this.fetchWithRetry(link.url);
    const showtimes: ScrapedShowtime[] = [];

    // Extract the main content area
    const contentRegex = /<div[^>]*class[^>]*content[^>]*>([\s\S]*?)<\/div>/gi;
    const contentMatch = contentRegex.exec(html);

    if (!contentMatch) {
      throw new Error('Could not find content area in weekly listing');
    }

    const content = contentMatch[1];

    // Parse movie listings - MDB typically uses paragraph or div structures
    const movieBlocks = this.extractMovieBlocks(content);

    for (const block of movieBlocks) {
      try {
        const parsedShowtimes = this.parseMovieBlock(block);
        showtimes.push(...parsedShowtimes);
      } catch (error) {
        console.error(`[MDB] Failed to parse movie block: ${error}`);
      }
    }

    return showtimes;
  }

  private extractMovieBlocks(content: string): string[] {
    // Split content by movie entries - typically separated by movie titles or paragraphs
    const blocks: string[] = [];

    // Split by common patterns in MDB articles
    const patterns = [
      /<p[^>]*>(.*?)<\/p>/gi,
      /<div[^>]*>(.*?)<\/div>/gi,
      /([A-Z][^.]*?(?:VOSE|VOS|VO|English|Original)[^.]*?(?:\d{1,2}[:.]\d{2})[^.]*?)(?=\n|<|$)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1]?.trim();
        if (text && text.length > 20 && this.containsMovieInfo(text)) {
          blocks.push(text);
        }
      }
    });

    return [...new Set(blocks)]; // Remove duplicates
  }

  private containsMovieInfo(text: string): boolean {
    const movieIndicators = [
      // Time patterns
      /\d{1,2}[:.h]\d{2}/,
      // VOSE indicators
      /VOSE|VOS|VO|Original|English/i,
      // Cinema names
      /CineCiutat|Ocimax|Cinesa|Festival Park|FAN Mallorca/i,
      // Common movie words
      /film|movie|cinema|showing/i
    ];

    return movieIndicators.some(pattern => pattern.test(text));
  }

  private parseMovieBlock(block: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    // Extract movie title (usually at the beginning)
    const titleMatch = block.match(/^([^-–—\n]{2,50}?)(?:\s*[-–—]\s*|$)/);
    const movieTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Movie';

    // Extract cinema name
    const cinemaName = this.extractCinemaName(block);

    // Extract showtimes
    const timeMatches = block.match(/\d{1,2}[:.h]\d{2}/g) || [];

    // Determine the date (usually from article title or context)
    const date = this.extractDate(block) || new Date();

    // Apply VOSE detection with debug enabled
    const voseResult = this.voseDetector.detectVOSE(
      block,
      BALEARIC_CINEMAS.find(c => c.name.includes(cinemaName)),
      movieTitle,
      true // Enable debug logging
    );

    // Create showtime entries for each time found
    timeMatches.forEach((timeStr, index) => {
      const time = this.parseTime(timeStr);
      if (time) {
        const startTime = new Date(date);
        startTime.setHours(time.hour, time.minute, 0, 0);

        showtimes.push({
          movieTitle,
          cinemaName,
          startTime,
          language: voseResult.detectedLanguage,
          isVOSE: voseResult.isVOSE,
          confidence: voseResult.confidence,
          source: this.source,
          rawText: block,
          verificationStatus: voseResult.confidence > 0.8 ? 'confirmed' : 'pending',
          scrapedAt: new Date()
        });
      }
    });

    return showtimes;
  }

  private extractCinemaName(text: string): string {
    const cinemaPatterns = [
      'CineCiutat',
      'Cine Ciutat',
      'Ocimax',
      'Cinesa',
      'Festival Park',
      'FAN Mallorca',
      'Mallorca Fashion Outlet'
    ];

    for (const pattern of cinemaPatterns) {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        return pattern;
      }
    }

    return 'Unknown Cinema';
  }

  private extractDate(text: string): Date | null {
    // Try to extract date from various formats common in MDB articles
    const datePatterns = [
      // Format: "January 15, 2025"
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
      // Format: "15 January 2025"
      /(\d{1,2})\s+(\w+)\s+(\d{4})/,
      // Format: "Friday, 15 January"
      /\w+,?\s+(\d{1,2})\s+(\w+)/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsed = this.parseSpanishDate(match[0]);
        if (parsed) return parsed;
      }
    }

    return null;
  }

  // Optional: Scrape cinema information (not implemented in this version)
  async scrapeCinemas(): Promise<ScrapingResult<ScrapedCinema>> {
    // MDB doesn't typically have dedicated cinema pages
    // Cinema info is embedded in the movie listings
    return this.createScrapingResult([], ['Cinema scraping not implemented for MDB']);
  }
}