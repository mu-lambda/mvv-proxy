#! /bin/bash
set -o xtrace

FILES=$(git diff --name-only --staged | grep -E '\.(ts|tsx|yaml|css|html)$' | xargs npx prettier -l) 
if [[ $FILES ]]; then
    npx prettier -w $FILES || echo "wtf"
    git add $FILES
fi
./build.sh || exit 
(cd server && npm test) || exit 1
