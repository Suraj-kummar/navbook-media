import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("🧪 Testing Navbook API")
print("=" * 60)

# Test 1: Check if API is running
print("\n1️⃣ Testing API health...")
try:
    response = requests.get(f"{BASE_URL}/")
    print(f"✅ API is running: {response.json()}")
except Exception as e:
    print(f"❌ API not responding: {e}")
    exit(1)

# Test 2: Register a new user
print("\n2️⃣ Testing user registration...")
register_data = {
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "testpass123"
}

try:
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=register_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 200:
        print("✅ Registration successful! OTP should be in backend console.")
        print("\n" + "=" * 60)
        print("📧 CHECK YOUR BACKEND TERMINAL FOR OTP!")
        print("=" * 60)
        
        # Prompt for OTP
        otp = input("\n🔐 Enter the OTP from backend console: ").strip()
        
        # Test 3: Verify OTP
        print("\n3️⃣ Testing OTP verification...")
        verify_data = {
            "email": register_data["email"],
            "otp": otp
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/verify-otp",
            json=verify_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            print("✅ OTP verification successful!")
            token = result.get("access_token")
            
            # Test 4: Get user info
            print("\n4️⃣ Testing authenticated request...")
            response = requests.get(
                f"{BASE_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            print(f"Status: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200:
                print("✅ Authentication working!")
                print("\n" + "=" * 60)
                print("🎉 ALL TESTS PASSED!")
                print("=" * 60)
            else:
                print("❌ Authentication failed")
        else:
            print("❌ OTP verification failed")
    else:
        print(f"❌ Registration failed: {result}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n✅ Test complete!")
