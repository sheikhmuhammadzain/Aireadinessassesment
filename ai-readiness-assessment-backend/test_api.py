import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api_health():
    """Test the API health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API health check passed")
        return True
    except Exception as e:
        print(f"❌ API health check failed: {str(e)}")
        return False

def test_questionnaires():
    """Test the questionnaires endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/questionnaires")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✅ Questionnaires endpoint passed, found {len(data)} assessment types")
        return True
    except Exception as e:
        print(f"❌ Questionnaires endpoint failed: {str(e)}")
        return False

def test_questionnaire_by_type():
    """Test getting a questionnaire by type"""
    try:
        # First get all questionnaires to find a valid type
        response = requests.get(f"{BASE_URL}/questionnaires")
        all_questionnaires = response.json()
        
        if not all_questionnaires:
            print("❌ No questionnaires found to test with")
            return False
            
        # Get the first assessment type
        assessment_type = list(all_questionnaires.keys())[0]
        
        # Test getting this specific questionnaire
        response = requests.get(f"{BASE_URL}/questionnaire/{assessment_type}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✅ Questionnaire by type endpoint passed for '{assessment_type}'")
        return True
    except Exception as e:
        print(f"❌ Questionnaire by type endpoint failed: {str(e)}")
        return False

def test_recommend_weights():
    """Test the recommend weights endpoint"""
    try:
        company_info = {
            "name": "Test Company",
            "size": "Mid-size (100-999 employees)",
            "industry": "Technology",
            "description": "A test company for API testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/recommend-weights",
            json=company_info
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "weights" in data
        weights = data["weights"]
        assert isinstance(weights, dict)
        
        # Check if weights sum to approximately 100
        total_weight = sum(weights.values())
        assert 99.5 <= total_weight <= 100.5, f"Total weight is {total_weight}, expected ~100"
        
        print(f"✅ Recommend weights endpoint passed, received weights for {len(weights)} categories")
        return True
    except Exception as e:
        print(f"❌ Recommend weights endpoint failed: {str(e)}")
        return False

def run_all_tests():
    """Run all API tests"""
    print("🔍 Running API tests...")
    
    tests = [
        test_api_health,
        test_questionnaires,
        test_questionnaire_by_type,
        test_recommend_weights
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
        time.sleep(0.5)  # Small delay between tests
    
    success_count = results.count(True)
    total_count = len(results)
    
    print(f"\n📊 Test Results: {success_count}/{total_count} tests passed")
    
    if all(results):
        print("✨ All tests passed! The API is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the API.")

if __name__ == "__main__":
    run_all_tests() 