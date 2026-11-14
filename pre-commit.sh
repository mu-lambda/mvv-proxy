#! /bin/bash
set -o xtrace

FILES=$(git diff --name-only --staged | grep -E '\.(ts|tsx|yaml|css|html)$' | xargs npx prettier -l) 
if [[ $FILES ]]; then
    npx prettier -w $FILES || echo "wtf"
    git add $FILES
fi
# The nearby page links each stylesheet with its version (staticFiles.ts).
# An @imported one has none, so it's rechecked on every load, and the
# browser finds it only after the stylesheet importing it has loaded.
if git --no-pager grep --cached -n '@import' -- '*.css'; then
    echo "No @import in CSS: link the stylesheet from the page instead" >&2
    exit 1
fi
bazel build //... || exit
bazel test //... || exit 1
