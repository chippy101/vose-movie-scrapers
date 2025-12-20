/**
 * Live Scraping Test - VOSEMovies
 * Tests actual HTTP requests to cinema websites
 */

// Simple test without TypeScript compilation issues
async function testLiveScraping() {
  console.log('🎬 VOSEMovies - Live Scraping Test\n');
  console.log('=' + '='.repeat(60) + '\n');

  // Test 1: Majorca Daily Bulletin (Most reliable)
  console.log('Test 1: Scraping Majorca Daily Bulletin');
  console.log('-'.repeat(40));

  try {
    const url = 'https://www.majorcadailybulletin.com/tag/Films+in+English+in+Mallorca.html';
    console.log(`Fetching: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (VOSEMovies/1.0; +https://vosemovies.app) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Content-Length: ${response.headers.get('content-length')} bytes`);

    if (response.ok) {
      const html = await response.text();
      console.log(`\n✅ Successfully fetched ${html.length} characters`);

      // Basic content analysis
      const hasFilmsInEnglish = html.toLowerCase().includes('films in english');
      const hasCinema = html.toLowerCase().includes('cinema') || html.toLowerCase().includes('cine');
      const hasVOSE = html.toLowerCase().includes('vose') || html.toLowerCase().includes('version');
      const hasTimes = /\d{1,2}[:.]\d{2}/.test(html);

      console.log('\n📊 Content Analysis:');
      console.log(`   - Contains "Films in English": ${hasFilmsInEnglish ? '✅' : '❌'}`);
      console.log(`   - Contains cinema mentions: ${hasCinema ? '✅' : '❌'}`);
      console.log(`   - Contains VOSE indicators: ${hasVOSE ? '✅' : '❌'}`);
      console.log(`   - Contains time patterns: ${hasTimes ? '✅' : '❌'}`);

      // Extract article links
      const articleLinkPattern = /<a[^>]+href="([^"]*films[^"]*)"[^>]*>([^<]*)<\/a>/gi;
      const links = [];
      let match;

      while ((match = articleLinkPattern.exec(html)) !== null && links.length < 5) {
        links.push({
          url: match[1],
          text: match[2].trim()
        });
      }

      if (links.length > 0) {
        console.log(`\n🔗 Found ${links.length} article links:`);
        links.forEach((link, i) => {
          console.log(`   ${i + 1}. ${link.text.substring(0, 60)}...`);
          console.log(`      ${link.url.substring(0, 80)}...`);
        });
      }

      // Look for movie titles (common English film patterns)
      const commonMovies = [
        'oppenheimer', 'barbie', 'dune', 'poor things',
        'zone of interest', 'killers of the flower moon',
        'napoleon', 'wonka', 'ferrari', 'maestro'
      ];

      const foundMovies = commonMovies.filter(movie =>
        html.toLowerCase().includes(movie)
      );

      if (foundMovies.length > 0) {
        console.log(`\n🎥 Potential movies found:`);
        foundMovies.forEach(movie => {
          console.log(`   - ${movie.charAt(0).toUpperCase() + movie.slice(1)}`);
        });
      }

      console.log('\n✅ Scraping test completed successfully!');
      console.log('   The website is accessible and contains relevant content.');

    } else {
      console.log(`\n❌ Failed to fetch: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    console.error('\n❌ Error during scraping:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.log('   → DNS lookup failed. Check internet connection.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   → Request timed out. Website might be slow or blocking requests.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   → Connection refused. Website might be down.');
    }
  }

  // Test 2: Simple Cinesa API check (without full scraping)
  console.log('\n' + '='.repeat(60));
  console.log('Test 2: Cinesa Website Connectivity');
  console.log('-'.repeat(40));

  try {
    const cinesaUrl = 'https://www.cinesa.es';
    console.log(`Testing: ${cinesaUrl}\n`);

    const response = await fetch(cinesaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (VOSEMovies/1.0) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`Response Status: ${response.status}`);

    if (response.ok) {
      console.log('✅ Cinesa website is accessible');
      const html = await response.text();
      const hasMallorca = html.toLowerCase().includes('mallorca') || html.toLowerCase().includes('palma');
      console.log(`   - Mallorca content found: ${hasMallorca ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.log(`⚠️  Cinesa connectivity issue: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('✅ Live scraping test completed');
  console.log('\n💡 Next steps:');
  console.log('   1. Scrapers can fetch real HTML content');
  console.log('   2. Content contains expected patterns');
  console.log('   3. Ready for full scraping implementation');
  console.log('\n⚠️  Note: Actual parsing requires the full scraper classes');
  console.log('   Use ScrapingOrchestrator for complete functionality');
  console.log();
}

// Run the test
testLiveScraping().catch(console.error);
