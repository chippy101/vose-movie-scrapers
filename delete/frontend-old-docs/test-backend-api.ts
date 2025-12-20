/**
 * Test script for backend API connection
 * Run with: npx ts-node test-backend-api.ts
 */

import { backendApi } from './src/services/api/backendApi';

async function testBackendConnection() {
  console.log('🧪 Testing Backend API Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing health check...');
    const health = await backendApi.healthCheck();
    console.log('✅ Health check passed:', health);
    console.log('');

    // Test 2: Get Islands
    console.log('2️⃣  Fetching islands...');
    const islands = await backendApi.getIslands();
    console.log(`✅ Found ${islands.length} islands:`, islands);
    console.log('');

    // Test 3: Get Cinemas
    console.log('3️⃣  Fetching cinemas...');
    const cinemas = await backendApi.getCinemas();
    console.log(`✅ Found ${cinemas.length} cinemas:`);
    cinemas.forEach(cinema => {
      console.log(`  - ${cinema.name} (${cinema.location}, ${cinema.island})`);
    });
    console.log('');

    // Test 4: Get Movies
    console.log('4️⃣  Fetching movies...');
    const movies = await backendApi.getMovies();
    console.log(`✅ Found ${movies.length} movies`);
    if (movies.length > 0) {
      console.log('  First movie:', movies[0].title);
    }
    console.log('');

    // Test 5: Get Today's Showtimes
    console.log('5️⃣  Fetching today\'s showtimes...');
    const showtimes = await backendApi.getShowtimesToday();
    console.log(`✅ Found ${showtimes.length} showtimes for today`);
    if (showtimes.length > 0) {
      const sample = showtimes[0];
      console.log('  Sample showtime:');
      console.log(`    Movie: ${sample.title}`);
      console.log(`    Cinema: ${sample.cinema_name} (${sample.island})`);
      console.log(`    Time: ${sample.showtime_time}`);
    }
    console.log('');

    // Test 6: Get Upcoming Showtimes
    console.log('6️⃣  Fetching upcoming showtimes...');
    const upcoming = await backendApi.getShowtimesUpcoming();
    console.log(`✅ Found ${upcoming.length} upcoming showtimes`);
    console.log('');

    // Summary
    console.log('============================================================');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('============================================================');
    console.log('\nSummary:');
    console.log(`  Islands: ${islands.length}`);
    console.log(`  Cinemas: ${cinemas.length}`);
    console.log(`  Movies: ${movies.length}`);
    console.log(`  Today's showtimes: ${showtimes.length}`);
    console.log(`  Upcoming showtimes: ${upcoming.length}`);
    console.log('\n✅ Backend API is working correctly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('\nMake sure the backend API is running on http://localhost:8000');
    console.error('You can start it with: uvicorn api.main:app --host 0.0.0.0 --port 8000');
    process.exit(1);
  }
}

// Run the test
testBackendConnection();
