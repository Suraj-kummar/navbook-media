#!/bin/bash

# Navbook API Test Script
# Tests all endpoints to verify the app is working correctly

API_URL="http://localhost:8000"
USERNAME="testuser"
PASSWORD="testpass123"

echo "===================="
echo "Navbook API Test"
echo "===================="
echo ""

# Test 1: Health Check
echo "1. Testing health endpoint..."
curl -s "$API_URL/health"
echo ""
echo ""

# Test 2: Register User
echo "2. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_RESPONSE" | grep -q "access_token"
if [ $? -eq 0 ]; then
  echo "✓ Registration successful"
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "Token: $TOKEN"
else
  echo "✗ Registration failed"
  echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 3: Login
echo "3. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | grep -q "access_token"
if [ $? -eq 0 ]; then
  echo "✓ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "Token: $TOKEN"
else
  echo "✗ Login failed"
  echo "$LOGIN_RESPONSE"
fi
echo ""

# Test 4: Get Current User Info
echo "4. Testing current user endpoint..."
curl -s "$API_URL/auth/me?token=$TOKEN"
echo ""
echo ""

# Test 5: List Files (should be empty)
echo "5. Testing file list endpoint..."
curl -s "$API_URL/files/list?token=$TOKEN"
echo ""
echo ""

echo "===================="
echo "Tests Complete!"
echo "===================="
echo ""
echo "If all tests passed:"
echo "- Backend is running ✓"
echo "- Database is connected ✓"
echo "- Authentication is working ✓"
echo "- File endpoints are ready ✓"
echo ""
echo "Next: Upload a test file through the frontend at http://localhost:3000"
