import { BaseScraper, ScrapingResult } from './BaseScraper';
import { ScrapedShowtime, ScrapedCinema } from '../../../types/Cinema';
import { VOSEDetector } from '../detectors/VOSEDetector';

/**
 * Aficine Network Scraper
 *
 * Aficine operates 6 cinemas across Balearic Islands:
 * Mallorca: Ocimax Palma, Rívoli, Augusta, Manacor
 * Menorca: Ocimax Maó
 * Ibiza: Multicines Eivissa
 *
 * This scraper handles all Aficine locations through their unified network
 */
export class AficineScraper extends BaseScraper {
  private readonly baseUrl = 'https://aficine.com';
  private readonly voseDetector = new VOSEDetector();

  // Cinema ID to name mapping (from URL parameter cineId)
  private readonly cinemaIdMap: { [key: string]: string } = {
    '17': 'Ocimax Palma',
    '19': 'Rívoli Palma',
    '20': 'Augusta Palma',
    '21': 'Aficine Manacor',
    '18': 'Ocimax Maó',
    '22': 'Multicines Eivissa'
  };

  // Aficine cinema locations with their slugs
  private readonly cinemaLocations = {
    'mallorca': [
      { slug: 'ocimaxpalma', name: 'Ocimax Palma', city: 'Palma' },
      { slug: 'rivoli', name: 'Rívoli', city: 'Palma' },
      { slug: 'augusta', name: 'Augusta', city: 'Palma' },
      { slug: 'manacor', name: 'Manacor', city: 'Manacor' }
    ],
    'menorca': [
      { slug: 'ocimaxmahon', name: 'Ocimax Maó', city: 'Maó' }
    ],
    'ibiza': [
      { slug: 'eivissa', name: 'Multicines Eivissa', city: 'Eivissa' }
    ]
  };

  constructor() {
    super('Aficine', {
      rateLimit: 2000, // 2 seconds between requests
      maxRetries: 3,
      timeout: 20000
    });
  }

  async scrapeShowtimes(): Promise<ScrapingResult<ScrapedShowtime>> {
    const errors: string[] = [];
    const showtimes: ScrapedShowtime[] = [];

    try {
      console.log(`[Aficine] Starting scrape for all Balearic Islands`);

      // Strategy 1: Scrape VOSE filter page (covers all cinemas)
      try {
        console.log(`[Aficine] Scraping VOSE filter page`);
        const voseShowtimes = await this.scrapeVOSEFilterPage();
        showtimes.push(...voseShowtimes);
        console.log(`[Aficine] Found ${voseShowtimes.length} VOSE showtimes from filter page`);
      } catch (error) {
        const errorMsg = `Failed to scrape VOSE filter page: ${error}`;
        console.error(`[Aficine] ${errorMsg}`);
        errors.push(errorMsg);
      }

      // Strategy 2: Scrape individual cinema pages for completeness
      for (const [island, cinemas] of Object.entries(this.cinemaLocations)) {
        console.log(`[Aficine] Scraping ${island} cinemas`);

        for (const cinema of cinemas) {
          try {
            const cinemaShowtimes = await this.scrapeCinemaPage(cinema, island);

            // Only add showtimes not already found from VOSE filter
            const newShowtimes = this.deduplicateShowtimes(cinemaShowtimes, showtimes);
            showtimes.push(...newShowtimes);

            console.log(`[Aficine] ${cinema.name}: ${cinemaShowtimes.length} total, ${newShowtimes.length} new`);
          } catch (error) {
            const errorMsg = `Failed to scrape ${cinema.name}: ${error}`;
            console.error(`[Aficine] ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
      }

    } catch (error) {
      const errorMsg = `Failed to scrape Aficine: ${error}`;
      console.error(`[Aficine] ${errorMsg}`);
      errors.push(errorMsg);
    }

    return this.createScrapingResult(showtimes, errors);
  }

  /**
   * Scrape the VOSE filter page that shows all VOSE movies across all cinemas
   */
  private async scrapeVOSEFilterPage(): Promise<ScrapedShowtime[]> {
    const url = `${this.baseUrl}/en/billboard/original-version-v-o-s-e/`;
    console.log(`[Aficine] Fetching VOSE filter: ${url}`);

    const html = await this.fetchWithRetry(url);
    return this.parseVOSEFilterPage(html);
  }

  /**
   * Parse the VOSE filter page
   */
  private parseVOSEFilterPage(html: string): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie links with vose=true parameter
      const movieLinks = this.extractMovieLinks(html);
      console.log(`[Aficine] Found ${movieLinks.length} VOSE movie links`);

      // Extract cinema name from URL and create showtimes
      for (const link of movieLinks) {
        // Extract cinema ID from URL: peliculas/movie-name/?cineId=17&vose=true
        const cinemaId = this.extractCinemaIdFromUrl(link.url);
        const cinemaName = cinemaId ? this.cinemaIdMap[cinemaId] : undefined;

        if (cinemaName) {
          console.log(`[Aficine] ${link.title} -> ${cinemaName} (cineId=${cinemaId})`);

          // Create a showtime entry with the specific cinema
          const startTime = new Date();
          startTime.setHours(20, 0, 0, 0); // Default evening showtime

          showtimes.push({
            movieTitle: link.title,
            cinemaName: cinemaName,
            cinemaLocation: this.getCinemaLocation(cinemaName),
            island: this.getCinemaIsland(cinemaName),
            startTime,
            language: 'VOSE',
            isVOSE: true,
            confidence: 0.95,
            source: this.source,
            rawText: link.url,
            url: link.url,
            scrapedAt: new Date()
          });
        } else {
          console.warn(`[Aficine] Could not determine cinema for ${link.title} (cineId=${cinemaId})`);
        }
      }

    } catch (error) {
      console.error(`[Aficine] Failed to parse VOSE filter page: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract cinema ID from Aficine movie URL
   */
  private extractCinemaIdFromUrl(url: string): string | null {
    const match = url.match(/cineId=(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Get cinema location from cinema name
   */
  private getCinemaLocation(cinemaName: string): string {
    if (cinemaName.includes('Palma')) return 'Palma de Mallorca';
    if (cinemaName.includes('Manacor')) return 'Manacor';
    if (cinemaName.includes('Maó')) return 'Maó';
    if (cinemaName.includes('Eivissa')) return 'Eivissa';
    return 'Mallorca';
  }

  /**
   * Get island from cinema name
   */
  private getCinemaIsland(cinemaName: string): string {
    if (cinemaName.includes('Maó')) return 'Menorca';
    if (cinemaName.includes('Eivissa')) return 'Ibiza';
    return 'Mallorca';
  }

  private extractMovieLinks(html: string): Array<{title: string; url: string}> {
    const links: Array<{title: string; url: string}> = [];

    console.log('\n🔍 [Aficine] Extracting movie links from HTML');
    console.log(`[Aficine] HTML length: ${html.length} characters`);
    console.log(`[Aficine] HTML snippet (first 500 chars): ${html.substring(0, 500)}`);

    // Look for links to movie pages with vose=true
    const linkPattern = /<a[^>]*href="([^"]*\/peliculas\/[^"]*vose=true[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    let matchCount = 0;

    console.log(`[Aficine] Searching for pattern: ${linkPattern.source}`);

    while ((match = linkPattern.exec(html)) !== null) {
      matchCount++;
      const url = match[1].startsWith('http') ? match[1] : `${this.baseUrl}${match[1]}`;
      const title = match[2].trim().replace(/&#8211;/g, '-').replace(/&#8217;/g, "'");

      console.log(`[Aficine] Match ${matchCount}: "${title}" -> ${url}`);

      if (title && title.length > 2) {
        links.push({ title, url });
      }
    }

    console.log(`[Aficine] Total matches found: ${matchCount}`);
    console.log(`[Aficine] Valid links extracted: ${links.length}`);

    // Try alternative patterns if no matches
    if (links.length === 0) {
      console.log('[Aficine] No matches with vose=true pattern, trying alternative patterns...');

      // Try any movie links
      const altPattern = /<a[^>]*href="([^"]*\/peliculas\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
      let altMatch;
      let altCount = 0;
      while ((altMatch = altPattern.exec(html)) !== null) {
        altCount++;
        if (altCount <= 5) { // Log first 5 for debugging
          console.log(`[Aficine] Alternative match ${altCount}: "${altMatch[2]}" -> ${altMatch[1]}`);
        }
      }
      console.log(`[Aficine] Total alternative movie links found: ${altCount}`);
    }

    const deduplicated = [...new Map(links.map(l => [l.title, l])).values()];
    console.log(`[Aficine] After deduplication: ${deduplicated.length} unique links`);

    return deduplicated;
  }

  /**
   * Scrape an individual cinema page
   */
  private async scrapeCinemaPage(
    cinema: { slug: string; name: string; city: string },
    island: string
  ): Promise<ScrapedShowtime[]> {
    const url = `${this.baseUrl}/en/cine/${cinema.slug}/`;
    console.log(`[Aficine] Fetching cinema page: ${url}`);

    const html = await this.fetchWithRetry(url);
    return this.parseCinemaPage(html, cinema, island);
  }

  /**
   * Parse a cinema-specific page
   */
  private parseCinemaPage(
    html: string,
    cinema: { slug: string; name: string; city: string },
    island: string
  ): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    try {
      // Extract movie blocks from cinema page
      const movieBlocks = this.extractAficineMovieCards(html);

      for (const block of movieBlocks) {
        const movieInfo = this.parseAficineMovieCard(block);

        if (movieInfo) {
          // Extract showtimes specific to this cinema
          const times = this.extractShowtimesFromBlock(block);
          const versionInfo = this.extractVersionInfo(block);

          // Apply VOSE detection with debug enabled
          const voseResult = this.voseDetector.detectVOSE(
            `${block} ${versionInfo}`,
            undefined,
            movieInfo.title,
            true // Enable debug logging
          );

          // Only include VOSE showtimes
          if (voseResult.isVOSE && voseResult.confidence > 0.5) {
            times.forEach(timeStr => {
              const time = this.parseTime(timeStr);
              if (time) {
                const startTime = new Date();
                startTime.setHours(time.hour, time.minute, 0, 0);

                showtimes.push({
                  movieTitle: movieInfo.title,
                  cinemaName: cinema.name,
                  startTime,
                  language: voseResult.detectedLanguage,
                  isVOSE: true,
                  confidence: voseResult.confidence,
                  source: this.source,
                  rawText: block,
                  posterUrl: movieInfo.posterUrl,
                  rating: movieInfo.rating,
                  duration: movieInfo.duration,
                  genre: movieInfo.genre,
                  ticketUrl: movieInfo.ticketUrl,
                  verificationStatus: voseResult.confidence > 0.8 ? 'confirmed' : 'pending',
                  scrapedAt: new Date(),
                  metadata: {
                    island,
                    city: cinema.city,
                    cinemaSlug: cinema.slug
                  }
                });
              }
            });
          }
        }
      }

    } catch (error) {
      console.error(`[Aficine] Failed to parse cinema page: ${error}`);
    }

    return showtimes;
  }

  /**
   * Extract movie cards from Aficine HTML
   */
  private extractAficineMovieCards(html: string): string[] {
    const blocks: string[] = [];

    // Aficine uses portfolio items for movies
    const patterns = [
      // Portfolio items
      /<div[^>]*class[^>]*portfolio-item[^>]*>(.*?)<\/div>/gis,
      /<article[^>]*class[^>]*movie[^>]*>(.*?)<\/article>/gis,
      /<div[^>]*class[^>]*movie-card[^>]*>(.*?)<\/div>/gis,
      // Movie containers
      /<div[^>]*class[^>]*film-item[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class[^>]*movie-section[^>]*>(.*?)<\/section>/gis,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const content = match[1]?.trim();
        if (content && content.length > 50) {
          blocks.push(content);
        }
      }
    });

    console.log(`[Aficine] Extracted ${blocks.length} movie blocks from HTML patterns`);

    // Also look for structured JSON data
    const jsonPattern = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
    let jsonMatch;
    while ((jsonMatch = jsonPattern.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData['@type'] === 'Movie' || jsonData.movie) {
          blocks.push(JSON.stringify(jsonData));
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    if (blocks.length === 0) {
      console.log(`[Aficine] WARNING: No movie blocks found. HTML length: ${html.length}`);
      console.log(`[Aficine] HTML sample (first 500 chars): ${html.substring(0, 500)}`);
    }

    return blocks;
  }

  /**
   * Parse Aficine movie card to extract metadata
   */
  private parseAficineMovieCard(block: string): {
    title: string;
    posterUrl?: string;
    rating?: string;
    duration?: number;
    genre?: string;
    ticketUrl?: string;
  } | null {
    try {
      // Try JSON first
      if (block.startsWith('{')) {
        const data = JSON.parse(block);
        return {
          title: data.name || data.title || 'Unknown Movie',
          posterUrl: data.image || data.poster,
          rating: data.rating || data.contentRating,
          duration: data.duration ? parseInt(data.duration) : undefined,
          genre: data.genre,
          ticketUrl: data.url
        };
      }

      // Parse HTML block
      const title = this.extractAficineTitle(block);
      const posterUrl = this.extractAficinePoster(block);
      const rating = this.extractAficineRating(block);
      const duration = this.extractAficineDuration(block);
      const genre = this.extractAficineGenre(block);
      const ticketUrl = this.extractAficineTicketUrl(block);

      if (!title || title === 'Unknown Movie') {
        return null;
      }

      return { title, posterUrl, rating, duration, genre, ticketUrl };

    } catch (error) {
      console.error(`[Aficine] Failed to parse movie card: ${error}`);
      return null;
    }
  }

  private extractAficineTitle(block: string): string {
    const titlePatterns = [
      /<h[1-6][^>]*class[^>]*portfolio-header[^>]*>.*?<a[^>]*>([^<]+)<\/a>/is,
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
      /<a[^>]*class[^>]*movie-title[^>]*>([^<]+)<\/a>/i,
      /"name":\s*"([^"]+)"/,
      /"title":\s*"([^"]+)"/
    ];

    for (const pattern of titlePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown Movie';
  }

  private extractAficinePoster(block: string): string | undefined {
    const posterPatterns = [
      /<img[^>]*src="([^"]*wp-content\/uploads[^"]*)"/i,
      /<img[^>]*data-src="([^"]*)"/i,
      /"image":\s*"([^"]+)"/,
      /"poster":\s*"([^"]+)"/
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

  private extractAficineRating(block: string): string | undefined {
    const ratingPatterns = [
      /rating[^>]*>([^<]+)</i,
      /age rating[^>]*>([^<]+)</i,
      /(\d+)\+/,
      /"contentRating":\s*"([^"]+)"/
    ];

    for (const pattern of ratingPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractAficineDuration(block: string): number | undefined {
    const durationPatterns = [
      /(\d+)\s*min(?:utes)?/i,
      /duration[^>]*>(\d+)/i,
      /"duration":\s*"?(\d+)"?/
    ];

    for (const pattern of durationPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractAficineGenre(block: string): string | undefined {
    const genrePatterns = [
      /<p[^>]*class[^>]*genre[^>]*>([^<]+)<\/p>/i,
      /genre[^>]*>([^<]+)</i,
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

  private extractAficineTicketUrl(block: string): string | undefined {
    const urlPatterns = [
      /<a[^>]*href="([^"]*ticket[^"]*)"/i,
      /<a[^>]*href="([^"]*comprar[^"]*)"/i,
      /<a[^>]*href="([^"]*reserva[^"]*)"/i,
      /"ticketUrl":\s*"([^"]+)"/,
      /"url":\s*"([^"]+)"/
    ];

    for (const pattern of urlPatterns) {
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

  private parseMovieShowtimes(block: string, movieInfo: any): ScrapedShowtime[] {
    const showtimes: ScrapedShowtime[] = [];

    // Extract showtimes and cinema info from the block
    const times = this.extractShowtimesFromBlock(block);
    const cinemaName = this.extractCinemaNameFromBlock(block) || 'Aficine';

    times.forEach(timeStr => {
      const time = this.parseTime(timeStr);
      if (time) {
        const startTime = new Date();
        startTime.setHours(time.hour, time.minute, 0, 0);

        showtimes.push({
          movieTitle: movieInfo.title,
          cinemaName,
          startTime,
          language: 'VOSE',
          isVOSE: true,
          confidence: 0.9, // High confidence from VOSE filter page
          source: this.source,
          rawText: block,
          posterUrl: movieInfo.posterUrl,
          rating: movieInfo.rating,
          duration: movieInfo.duration,
          genre: movieInfo.genre,
          ticketUrl: movieInfo.ticketUrl,
          verificationStatus: 'confirmed',
          scrapedAt: new Date()
        });
      }
    });

    return showtimes;
  }

  private extractShowtimesFromBlock(block: string): string[] {
    const times: string[] = [];

    const timePatterns = [
      /\[(\d{1,2}:\d{2})\]/g, // [15:30] format
      /<button[^>]*>(\d{1,2}:\d{2})<\/button>/g,
      /<span[^>]*class[^>]*time[^>]*>(\d{1,2}:\d{2})<\/span>/g,
      /(\d{1,2}:\d{2})/g
    ];

    timePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(block)) !== null) {
        const timeStr = match[1];
        if (timeStr && /\d{1,2}:\d{2}/.test(timeStr)) {
          times.push(timeStr);
        }
      }
    });

    return [...new Set(times)]; // Remove duplicates
  }

  private extractCinemaNameFromBlock(block: string): string | undefined {
    const cinemaPatterns = [
      /cinema[^>]*>([^<]+)</i,
      /location[^>]*>([^<]+)</i,
      /(Ocimax|Rívoli|Augusta|Manacor|Eivissa)/i
    ];

    for (const pattern of cinemaPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractVersionInfo(block: string): string {
    const versionPatterns = [
      /<[^>]*class[^>]*version[^>]*>([^<]+)<\/[^>]*>/gi,
      /<[^>]*class[^>]*original[^>]*>([^<]+)<\/[^>]*>/gi,
      /VOSE|V\.O\.S\.E|Original|Subtitulada|English/gi
    ];

    const versions: string[] = [];
    versionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(block)) !== null) {
        if (match[1]) {
          versions.push(match[1]);
        } else if (match[0]) {
          versions.push(match[0]);
        }
      }
    });

    return versions.join(' ');
  }

  /**
   * Remove duplicate showtimes
   */
  private deduplicateShowtimes(
    newShowtimes: ScrapedShowtime[],
    existingShowtimes: ScrapedShowtime[]
  ): ScrapedShowtime[] {
    return newShowtimes.filter(newSt => {
      return !existingShowtimes.some(existingSt =>
        existingSt.movieTitle === newSt.movieTitle &&
        existingSt.cinemaName === newSt.cinemaName &&
        existingSt.startTime.getTime() === newSt.startTime.getTime()
      );
    });
  }

  async scrapeCinemas(): Promise<ScrapingResult<ScrapedCinema>> {
    const errors: string[] = [];
    const cinemas: ScrapedCinema[] = [];

    try {
      console.log(`[Aficine] Scraping cinema information`);

      // Create cinema entries from our known locations
      for (const [island, locations] of Object.entries(this.cinemaLocations)) {
        for (const location of locations) {
          cinemas.push({
            name: location.name,
            chain: 'Aficine',
            location: {
              lat: 0, // Placeholder - would need actual coordinates
              lng: 0,
              address: location.city,
              city: location.city,
              region: island.charAt(0).toUpperCase() + island.slice(1)
            },
            voseSupport: 'frequent', // Aficine has good VOSE support
            contact: {
              website: `${this.baseUrl}/en/cine/${location.slug}/`
            },
            source: this.source,
            lastUpdated: new Date().toISOString(),
            verificationStatus: 'verified',
            metadata: {
              slug: location.slug,
              island
            }
          } as ScrapedCinema);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to scrape Aficine cinemas: ${error}`;
      errors.push(errorMsg);
    }

    return this.createScrapingResult(cinemas, errors);
  }
}
