#!/bin/bash

# NOISE API - Example curl Requests
# ==================================
# These examples demonstrate how to interact with the NOISE backend API.
# Replace YOUR_TOKEN and ITEM_ID with actual values.

BASE_URL="http://localhost:3001"

echo "=== NOISE API Example Requests ==="
echo ""

# 1. Create a Session
echo "1. Create Session (get token and ownerId)"
echo "curl -X POST $BASE_URL/api/session"
echo ""
echo "Response example:"
echo '{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","ownerId":"550e8400-e29b-41d4-a716-446655440000"}'
echo ""

# 2. Get Board
echo "2. Get Board (all items)"
echo "curl $BASE_URL/api/board"
echo ""
echo "# With pagination:"
echo "curl \"$BASE_URL/api/board?limit=50&offset=0\""
echo ""

# 3. Create Audio Item
echo "3. Create Audio Item (requires token and audio file)"
cat << 'EOF'
curl -X POST $BASE_URL/api/audio-items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/recording.webm" \
  -F "x=100" \
  -F "y=200" \
  -F "visualFormat=waveform" \
  -F "scale=100"
EOF
echo ""
echo "# visualFormat options: waveform, bars, spectrum"
echo "# scale range: 25-300"
echo ""

# 4. Update Audio Item
echo "4. Update Audio Item (owner only)"
cat << 'EOF'
curl -X PATCH $BASE_URL/api/audio-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "x": 150,
    "y": 250,
    "scale": 120,
    "visualFormat": "bars"
  }'
EOF
echo ""

# 5. Re-record Audio
echo "5. Re-record Audio (replace audio file, owner only)"
cat << 'EOF'
curl -X POST $BASE_URL/api/audio-items/ITEM_ID/rerecord \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/new-recording.webm"
EOF
echo ""

# 6. Delete Audio Item
echo "6. Delete Audio Item (owner only)"
cat << 'EOF'
curl -X DELETE $BASE_URL/api/audio-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
EOF
echo ""

# 7. Create Text Item
echo "7. Create Text Item"
cat << 'EOF'
curl -X POST $BASE_URL/api/text-items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello World!",
    "x": 100,
    "y": 200,
    "font": "rubik-glitch",
    "opacity": 100,
    "scale": 100
  }'
EOF
echo ""
echo "# font options: rubik-glitch, kapakana, shadows"
echo "# opacity range: 0-100"
echo "# scale range: 25-300"
echo ""

# 8. Update Text Item
echo "8. Update Text Item (owner only)"
cat << 'EOF'
curl -X PATCH $BASE_URL/api/text-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Updated caption",
    "font": "kapakana",
    "opacity": 80,
    "x": 200,
    "y": 300
  }'
EOF
echo ""

# 9. Delete Text Item
echo "9. Delete Text Item (owner only)"
cat << 'EOF'
curl -X DELETE $BASE_URL/api/text-items/ITEM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
EOF
echo ""

# 10. Health Check
echo "10. Health Check"
echo "curl $BASE_URL/health"
echo ""

# 11. API Documentation
echo "11. API Documentation"
echo "# Interactive Swagger UI: $BASE_URL/api/docs"
echo "# OpenAPI JSON: $BASE_URL/api/docs.json"
echo ""

# Example workflow
echo "=== Example Workflow ==="
echo ""
cat << 'EOF'
# Step 1: Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/session | jq -r '.token')
OWNER_ID=$(curl -s -X POST http://localhost:3001/api/session | jq -r '.ownerId')
echo "Token: $TOKEN"
echo "Owner ID: $OWNER_ID"

# Step 2: Create a text item
ITEM=$(curl -s -X POST http://localhost:3001/api/text-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"My first noise!","x":100,"y":100,"font":"rubik-glitch","opacity":100,"scale":100}')
ITEM_ID=$(echo $ITEM | jq -r '.id')
echo "Created item: $ITEM_ID"

# Step 3: Update the item
curl -s -X PATCH "http://localhost:3001/api/text-items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Updated noise!","scale":150}'

# Step 4: Get the board to see all items
curl -s http://localhost:3001/api/board | jq

# Step 5: Delete the item
curl -s -X DELETE "http://localhost:3001/api/text-items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN"
EOF
