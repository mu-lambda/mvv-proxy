#! /bin/bash
set -o xtrace

FILES=$(git diff --name-only --staged | grep -E '\.(ts|yaml|css|html)$' | xargs npx prettier -l) 
if [[ $FILES ]]; then
    npx prettier -w $FILES || echo "wtf"
    git add $FILES
fi
(cd server && npm run build) || exit 1
(cd server && npm test) || exit 1
