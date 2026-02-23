#!/bin/sh

# Get staged files that Prettier can format
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx|css|scss|html|json|md)$')

# Exit if nothing to format
[ -z "$FILES" ] && exit 0

echo "Running Prettier on staged files..."

# Run prettier
npx prettier --write $FILES

# Re-add formatted files to staging
git add $FILES

exit 0