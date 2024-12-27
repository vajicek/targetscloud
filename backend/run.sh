#!/bin/sh

# Update url for backend
sed "s,API_URL,${API_URL:-http://localhost},g" dist/browser/assets/config.json.template > dist/browser/assets/config.json
sed -i "s,GOOGLE_CLIENT_ID,${GOOGLE_CLIENT_ID},g" dist/browser/assets/config.json

# Run
npm start -- $@
