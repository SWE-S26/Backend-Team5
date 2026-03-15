#!/bin/sh
echo "Running type checker before commit..."

if npm run type-check; then
  printf "\x1b[32mType check passed.\x1b[0m\n"
else
  printf "\x1b[31mType check failed.\x1b[0m\n"
  printf "\x1b[31mDON'T LET ME SEE THAT SHIT PLEASE!\x1b[0m\n"
fi