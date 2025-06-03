./generate-docs.sh 
find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./test-results/*" -not -path "./playwright-report/*" -exec sh -c 'echo "\n=== $1 ==="; grep -E "^\s*(//|/\*|\*)" "$1" || echo "No comments found"' _ {} \; > repomix-output.txt

#cd docs  && rm -f repomix-output.* && npx repomix --style plain  --compress --remove-comments   --remove-empty-lines    .  && mv repomix-output.* .. && cd ..

