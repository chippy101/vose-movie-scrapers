// Clear AsyncStorage cache to force fresh scraping
const AsyncStorage = require('@react-native-async-storage/async-storage');

async function clearCache() {
  try {
    await AsyncStorage.removeItem('vose_showtimes_data');
    console.log('✅ Cache cleared successfully');
    console.log('   The app will now fetch fresh data from all sources on next launch');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

clearCache();
