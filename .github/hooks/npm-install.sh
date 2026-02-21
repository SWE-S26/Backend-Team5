#!/bin/sh
CHANGED_FILES=$(git diff --name-only ORIG_HEAD HEAD)

echo "$CHANGED_FILES" | grep -q "^package.json$"
if [ $? -eq 0 ]; then
    echo "Detected changes in package.json. Running npm install..."
    npm install
fi