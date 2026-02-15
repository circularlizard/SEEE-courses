# SEEE Courses

This repository contains course materials for the SEEE (South East Explorers Expeditions) programme.

## Getting Started

Clone this repository and explore the course materials.

## Structure

- Course materials are organized by topic/module
- Each module contains relevant resources and assignments

## Course Validation

This project includes a Node.js validator script to ensure course JSON files meet the Tutor LMS schema requirements.

### Installing Dependencies

```bash
cd scripts
npm install
```

### Using the Validator

**Validate a single course file:**
```bash
cd scripts
node validate-course.js ../courses/9362/9362.json
```

**Validate all courses in a directory:**
```bash
cd scripts
node validate-course.js ../courses/
```

**Validate all example files:**
```bash
cd scripts
npm run validate:all
```

**Additional options:**
```bash
# Show detailed output
node validate-course.js --verbose ../courses/9362/9362.json

# Output results as JSON
node validate-course.js --json ../courses/9362/9362.json
```

The validator checks:
- JSON schema compliance
- Business rules (e.g., parent-child relationships)
- Required fields and data types
- Logical consistency

## Contributing

Feel free to contribute to the course materials by submitting pull requests. All course JSON files must pass validation before being merged.
