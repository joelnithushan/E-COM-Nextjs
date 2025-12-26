#!/bin/bash

# Security Check Script
# Prevents committing secrets to Git

echo "🔍 Checking for potential secrets in staged files..."

# Check for common secret patterns
SECRET_PATTERNS=(
    "sk_live_[a-zA-Z0-9]{24,}"
    "sk_test_[a-zA-Z0-9]{24,}"
    "pk_live_[a-zA-Z0-9]{24,}"
    "pk_test_[a-zA-Z0-9]{24,}"
    "whsec_[a-zA-Z0-9]{24,}"
    "mongodb\+srv://[^:]+:[^@]+@"
    "mongodb://[^:]+:[^@]+@"
)

FOUND_SECRETS=0

# Check staged files
STAGED_FILES=$(git diff --cached --name-only)

for file in $STAGED_FILES; do
    # Skip .env.example files
    if [[ "$file" == *".env.example"* ]] || [[ "$file" == *"SECURITY_NOTES.md"* ]]; then
        continue
    fi
    
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if git diff --cached "$file" | grep -qE "$pattern"; then
            echo "❌ WARNING: Potential secret found in $file"
            echo "   Pattern: $pattern"
            FOUND_SECRETS=1
        fi
    done
done

# Check for .env files being added
if echo "$STAGED_FILES" | grep -qE "\.env$|\.env\.(local|development|staging|production)$"; then
    echo "❌ ERROR: Attempting to commit .env file!"
    echo "   .env files should NEVER be committed"
    FOUND_SECRETS=1
fi

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo "🚨 SECURITY ALERT: Potential secrets detected!"
    echo "   Please remove secrets from code and use environment variables instead."
    echo "   See SECURITY_NOTES.md for more information."
    exit 1
else
    echo "✅ No secrets detected in staged files"
    exit 0
fi



