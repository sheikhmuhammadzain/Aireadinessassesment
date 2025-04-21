// Simple script to test fetching questionnaires directly from the local endpoint
import { fetchQuestionnairesDirectly } from '../lib/api';

async function testFetchQuestionnaires() {
  try {
    console.log('Starting test to fetch questionnaires directly...');
    const data = await fetchQuestionnairesDirectly();
    console.log('Successfully fetched questionnaires:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Execute the test
testFetchQuestionnaires(); 