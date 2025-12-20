import { ScrapedCinema, ScrapedShowtime, ScrapingSource } from '../../../types/Cinema';

export interface ScrapingConfig {
  rateLimit: number; // milliseconds between requests
  maxRetries: number;
  timeout: number;
  userAgent: string;
}

export interface ScrapingResult<T> {
  data: T[];
  success: boolean;
  errors: string[];
  scrapedAt: Date;
  source: ScrapingSource;
}

export abstract class BaseScraper {
  protected config: ScrapingConfig = {
    rateLimit: 1000, // 1 second between requests
    maxRetries: 3,
    timeout: 10000, // 10 seconds
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  protected source: ScrapingSource;

  constructor(source: ScrapingSource, config?: Partial<ScrapingConfig>) {
    this.source = source;
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  abstract scrapeShowtimes(): Promise<ScrapingResult<ScrapedShowtime>>;
  abstract scrapeCinemas?(): Promise<ScrapingResult<ScrapedCinema>>;

  protected async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`[${this.source}] Fetching ${url} (attempt ${attempt})`);

        // React Native compatible timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': this.config.userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Cache-Control': 'max-age=0',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const html = await response.text();

          // Rate limiting
          if (attempt < this.config.maxRetries) {
            await this.sleep(this.config.rateLimit);
          }

          return html;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`[${this.source}] Attempt ${attempt} failed:`, error);

        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 30000);
          await this.sleep(backoffTime);
        }
      }
    }

    throw new Error(`Failed to fetch ${url} after ${this.config.maxRetries} attempts: ${lastError!.message}`);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected extractText(html: string, selector: string): string[] {
    // Basic text extraction - in a real implementation, you'd use a proper HTML parser
    // This is a simplified version for demonstration
    const matches: string[] = [];

    // Simple regex-based extraction (replace with proper HTML parser in production)
    const textRegex = new RegExp(`<[^>]*class[^>]*${selector}[^>]*>([^<]*)</`, 'gi');
    let match;

    while ((match = textRegex.exec(html)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }

  protected extractLinks(html: string, baseUrl: string): { text: string; url: string }[] {
    const links: { text: string; url: string }[] = [];

    // Simple link extraction (replace with proper HTML parser in production)
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).toString();
      links.push({ text: match[2].trim(), url });
    }

    return links;
  }

  protected createScrapingResult<T>(
    data: T[],
    errors: string[] = []
  ): ScrapingResult<T> {
    return {
      data,
      success: errors.length === 0,
      errors,
      scrapedAt: new Date(),
      source: this.source
    };
  }

  // Utility method for parsing dates in Spanish format
  protected parseSpanishDate(dateStr: string): Date | null {
    try {
      // Handle various Spanish date formats
      const spanishMonths = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
      };

      let normalizedDate = dateStr.toLowerCase();

      // Replace Spanish month names with numbers
      Object.entries(spanishMonths).forEach(([spanish, number]) => {
        normalizedDate = normalizedDate.replace(spanish, number);
      });

      // Try to parse the normalized date
      const date = new Date(normalizedDate);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  // Utility method for parsing time strings
  protected parseTime(timeStr: string): { hour: number; minute: number } | null {
    const timeRegex = /(\d{1,2})[:.h](\d{2})?/;
    const match = timeStr.match(timeRegex);

    if (match) {
      const hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }

    return null;
  }
}