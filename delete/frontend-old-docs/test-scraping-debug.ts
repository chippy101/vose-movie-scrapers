/**
 * Comprehensive Scraping Debug Test
 *
 * This script tests all scrapers with full debugging enabled to understand
 * why they're returning 0 showtimes.
 */

import { AficineScraper } from './src/services/scraping/scrapers/AficineScraper';
import { CineCiutatScraper } from './src/services/scraping/scrapers/CineCiutatScraper';
import { MajorcaDailyBulletinScraper } from './src/services/scraping/scrapers/MajorcaDailyBulletinScraper';
import { CinesMoixNegreScraper } from './src/services/scraping/scrapers/CinesMoixNegreScraper';

console.log('='.repeat(80));
console.log('COMPREHENSIVE SCRAPING DEBUG TEST');
console.log('='.repeat(80));
console.log('\nThis test will show:');
console.log('- Raw HTML snippets from each site');
console.log('- Regex patterns being used');
console.log('- What matches are found (if any)');
console.log('- VOSE detection logic and results');
console.log('- Why scrapers return 0 showtimes\n');

async function testScraper(scraper: any, name: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING: ${name}`);
  console.log('='.repeat(80));

  try {
    const startTime = Date.now();
    const result = await scraper.scrapeShowtimes();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n📊 ${name} Results:`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Showtimes found: ${result.data.length}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.data.length > 0) {
      console.log(`\n✅ SUCCESS! Sample showtimes:`);
      result.data.slice(0, 3).forEach((showtime: any, idx: number) => {
        console.log(`   ${idx + 1}. ${showtime.movieTitle} at ${showtime.cinemaName}`);
        console.log(`      Time: ${showtime.startTime.toTimeString().slice(0, 5)}`);
        console.log(`      Language: ${showtime.language}, Confidence: ${showtime.confidence.toFixed(2)}`);
      });
    } else {
      console.log(`\n❌ FAILED: No showtimes found`);
    }

    if (result.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered:`);
      result.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }

    return result;

  } catch (error: any) {
    console.error(`\n💥 EXCEPTION in ${name}:`);
    console.error(`   ${error.message}`);
    console.error(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n   ')}`);
    return { data: [], errors: [error.message] };
  }
}

async function testAllScrapers() {
  const scrapers = [
    { scraper: new AficineScraper(), name: 'Aficine' },
    { scraper: new CineCiutatScraper(), name: 'CineCiutat' },
    { scraper: new MajorcaDailyBulletinScraper(), name: 'Majorca Daily Bulletin' },
    { scraper: new CinesMoixNegreScraper(), name: 'Cines Moix Negre' }
  ];

  const results: Record<string, any> = {};

  for (const { scraper, name } of scrapers) {
    results[name] = await testScraper(scraper, name);

    // Add delay between scrapers to be respectful
    if (name !== scrapers[scrapers.length - 1].name) {
      console.log('\n⏳ Waiting 3 seconds before next scraper...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  let totalShowtimes = 0;
  let successfulScrapers = 0;

  for (const [name, result] of Object.entries(results)) {
    const count = result.data.length;
    totalShowtimes += count;
    if (count > 0) successfulScrapers++;

    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${name}: ${count} showtimes, ${result.errors.length} errors`);
  }

  console.log(`\nTotal showtimes: ${totalShowtimes}`);
  console.log(`Successful scrapers: ${successfulScrapers}/${scrapers.length}`);
  console.log(`Success rate: ${((successfulScrapers / scrapers.length) * 100).toFixed(1)}%`);

  // Diagnosis
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS');
  console.log('='.repeat(80));

  if (totalShowtimes === 0) {
    console.log('\n⚠️ ALL SCRAPERS RETURNED 0 SHOWTIMES');
    console.log('\nPossible reasons:');
    console.log('1. Wrong HTML selectors/regex patterns');
    console.log('2. Websites use JavaScript/AJAX to load content');
    console.log('3. VOSE keywords not being detected');
    console.log('4. Wrong URLs being scraped');
    console.log('5. Websites have changed their HTML structure');
    console.log('\nReview the debug logs above to identify the issue.');
  } else if (successfulScrapers < scrapers.length) {
    console.log('\n⚠️ SOME SCRAPERS FAILED');
    console.log('\nFailed scrapers:');
    for (const [name, result] of Object.entries(results)) {
      if (result.data.length === 0) {
        console.log(`- ${name}: ${result.errors.length} errors`);
      }
    }
  } else {
    console.log('\n✅ ALL SCRAPERS WORKING!');
  }

  console.log('\n' + '='.repeat(80));
}

// Run the tests
testAllScrapers().catch(error => {
  console.error('\n💥 FATAL ERROR:');
  console.error(error);
  process.exit(1);
});
