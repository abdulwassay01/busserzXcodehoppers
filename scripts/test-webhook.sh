#!/usr/bin/env bash

echo "========================================"
echo "  Busserz Local Webhook Test Script"
echo "========================================"

PORT=${1:-4000}
TARGET_URL="http://localhost:${PORT}/webhook"

echo "Sending test Webhook POST request to ${TARGET_URL}..."

curl -i -X POST "${TARGET_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "products.updated",
    "key": "products",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

echo ""
echo "----------------------------------------"
echo "Sending test Webhook POST request for menus..."

curl -i -X POST "${TARGET_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "menus.updated",
    "key": "menus",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

echo ""
echo "========================================"
echo "Done!"
