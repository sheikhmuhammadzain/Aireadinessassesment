// Test script to verify frontend API connection
import { 
  fetchQuestionnaire, 
  fetchAllQuestionnaires, 
  getRecommendedWeights 
} from '../lib/api';

async function testApiConnection() {
  console.log('🔍 Testing frontend API connection to backend...');
  
  try {
    // Test 1: Fetch all questionnaires
    console.log('\n📋 Test 1: Fetching all questionnaires...');
    const questionnaires = await fetchAllQuestionnaires();
    console.log(`✅ Successfully fetched ${Object.keys(questionnaires).length} questionnaire types`);
    
    // Test 2: Fetch a specific questionnaire
    if (Object.keys(questionnaires).length > 0) {
      const firstType = Object.keys(questionnaires)[0];
      console.log(`\n📋 Test 2: Fetching questionnaire of type "${firstType}"...`);
      const questionnaire = await fetchQuestionnaire(firstType);
      console.log(`✅ Successfully fetched questionnaire with ${Object.keys(questionnaire).length} categories`);
    } else {
      console.log('⚠️ Skipping Test 2: No questionnaire types available');
    }
    
    // Test 3: Get recommended weights
    console.log('\n📋 Test 3: Getting recommended weights...');
    const companyInfo = {
      name: 'Test Company',
      size: 'Mid-size (100-999 employees)',
      industry: 'Technology',
      description: 'A test company for API testing'
    };
    
    const recommendedWeights = await getRecommendedWeights(companyInfo);
    console.log(`✅ Successfully received recommended weights for ${Object.keys(recommendedWeights).length} categories`);
    
    // Overall result
    console.log('\n🎉 All API connection tests passed! Frontend can connect to backend successfully.');
    
  } catch (error) {
    console.error('\n❌ API connection test failed:', error.message);
    console.error('Please check that:');
    console.error('1. The backend server is running on the correct port');
    console.error('2. NEXT_PUBLIC_API_URL is correctly set in .env.local');
    console.error('3. There are no CORS issues preventing the connection');
    console.error('\nError details:', error);
  }
}

// Run the test
testApiConnection();

// Export for use in other files if needed
export { testApiConnection }; 