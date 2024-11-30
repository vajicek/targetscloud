#!/bin/sh

# Update url for backend
sed "s,API_URL,${API_URL:-http://localhost},g" browser/assets/config.json.template > browser/assets/config.json

# Run
node app.js $@