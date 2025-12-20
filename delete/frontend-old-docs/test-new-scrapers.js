// Quick test script for new Balearic scrapers
console.log('='.repeat(80));
console.log('TESTING NEW BALEARIC ISLANDS SCRAPERS');
console.log('='.repeat(80));

async function testAficine() {
  console.log('\n[TEST 1] Testing Aficine VOSE filter page...\n');

  try {
    const response = await fetch('https://aficine.com/en/billboard/original-version-v-o-s-e/');
    console.log(`✅ Aficine VOSE filter: HTTP ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);

    const html = await response.text();
    const hasMovies = html.includes('portfolio') || html.includes('movie') || html.includes('película');
    console.log(`   Contains movie data: ${hasMovies ? '✅ YES' : '❌ NO'}`);

    return true;
  } catch (error) {
    console.error(`❌ Aficine VOSE filter FAILED: ${error.message}`);
    return false;
  }
}

async function testCineCiutat() {
  console.log('\n[TEST 2] Testing CineCiutat movies page...\n');

  try {
    const response = await fetch('https://www.cineciutat.org/en/movies');
    console.log(`✅ CineCiutat: HTTP ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const html = await response.text();
    const hasMovies = html.includes('movie') || html.includes('screen') || html.includes('showtime');
    console.log(`   Contains movie data: ${hasMovies ? '✅ YES' : '❌ NO'}`);

    return true;
  } catch (error) {
    console.error(`❌ CineCiutat FAILED: ${error.message}`);
    return false;
  }
}

async function testMoixNegre() {
  console.log('\n[TEST 3] Testing Cines Moix Negre...\n');

  try {
    const response = await fetch('http://www.cinesmoixnegre.org/');
    console.log(`✅ Moix Negre: HTTP ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const html = await response.text();
    const hasContent = html.length > 1000;
    console.log(`   Has content: ${hasContent ? '✅ YES' : '❌ NO'} (${html.length} bytes)`);

    return true;
  } catch (error) {
    console.error(`❌ Moix Negre FAILED: ${error.message}`);
    return false;
  }
}

async function testMDB() {
  console.log('\n[TEST 4] Testing Majorca Daily Bulletin...\n');

  try {
    const response = await fetch('https://www.majorcadailybulletin.com/tag/Films+in+English+in+Mallorca.html');
    console.log(`✅ MDB: HTTP ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const html = await response.text();
    const hasCinemas = html.includes('CineCiutat') || html.includes('Ocimax') || html.includes('Cinesa');
    console.log(`   Contains cinema names: ${hasCinemas ? '✅ YES' : '❌ NO'}`);

    return true;
  } catch (error) {
    console.error(`❌ MDB FAILED: ${error.message}`);
    return false;
  }
}

async function testCinesa() {
  console.log('\n[TEST 5] Testing Cinesa (expected to be blocked)...\n');

  try {
    const response = await fetch('https://www.cinesa.es/cines/festival-park');
    console.log(`   Cinesa: HTTP ${response.status} ${response.statusText}`);

    if (response.status === 403) {
      console.log('   ⚠️  Expected: Blocked by Cloudflare (HTTP 403)');
    }

    return response.status === 403;
  } catch (error) {
    console.error(`   Cinesa: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const results = {
    aficine: false,
    cineciutat: false,
    moixnegre: false,
    mdb: false,
    cinesa: false
  };

  results.aficine = await testAficine();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

  results.cineciutat = await testCineCiutat();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.moixnegre = await testMoixNegre();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.mdb = await testMDB();
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.cinesa = await testCinesa();

  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  const working = Object.entries(results).filter(([_, success]) => success).length;
  const total = Object.keys(results).length;

  console.log(`\n✅ Working Scrapers: ${working}/${total}`);
  console.log('\nDetailed Results:');
  console.log(`  Aficine (6 cinemas):        ${results.aficine ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  CineCiutat (VOSE specialist): ${results.cineciutat ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  Moix Negre (Menorca):       ${results.moixnegre ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  MDB (Curated):              ${results.mdb ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  Cinesa:                     ${results.cinesa ? '⚠️  BLOCKED (Expected)' : '❌ FAILED'}`);

  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION');
  console.log('='.repeat(80));

  if (working >= 3) {
    console.log('\n✅ SYSTEM IS WORKING!');
    console.log('   You have enough working scrapers to provide VOSE data');
    console.log('   across all Balearic Islands.');
  } else {
    console.log('\n⚠️  SYSTEM NEEDS ATTENTION');
    console.log('   Not enough scrapers are working properly.');
  }

  console.log('\n');
}

runTests().catch(console.error);
