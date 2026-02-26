#!/bin/sh
echo "Running type checker before commit..."
npm run type-check

printf "\x1b[34mI think you are fine.\x1b[0m\n"