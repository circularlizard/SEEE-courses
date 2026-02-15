---
description: Require course validation after JSON course spec changes
trigger: model_decision
---

# Course Validation Rule

After any course JSON file is modified, you must run the validator to ensure the file meets schema requirements.

## When to Run Validation

Run validation after making changes to any of these files:
- `courses/**/*.json`
- `examples/**/*.json`

## How to Validate

1. Navigate to the scripts directory:
   ```bash
   cd scripts
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Validate the changed file:
   ```bash
   node validate-course.js <path-to-changed-file>
   ```

   Or validate all files:
   ```bash
   npm run validate:all
   ```

## Validation Requirements

- All course JSON files must pass validation
- No schema errors are allowed
- Warnings should be reviewed and resolved if possible
- Files with validation errors cannot be committed

## Automation

Consider adding a pre-commit hook to automatically run validation:
```bash
#!/bin/sh
# .git/hooks/pre-commit
cd scripts
npm run validate:all
```
