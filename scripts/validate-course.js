#!/usr/bin/env node

/**
 * Tutor LMS Pro Course Export Validator
 * 
 * Validates course export JSON files against the Tutor LMS schema.
 * Uses JSON Schema for structural validation plus custom business rules.
 * 
 * Usage:
 *   node validate-course.js <file.json>           # Validate single file
 *   node validate-course.js <directory>           # Validate all JSON files in directory
 *   node validate-course.js --all                 # Validate all examples
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

class CourseValidator {
  constructor(schemaPath) {
    this.ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
    addFormats(this.ajv);
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    this.schema = JSON.parse(schemaContent);
    this.validate = this.ajv.compile(this.schema);
    
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a course export file
   * @param {string} filePath - Path to the JSON file
   * @returns {object} Validation result with errors and warnings
   */
  validateFile(filePath) {
    this.errors = [];
    this.warnings = [];

    // Read and parse JSON
    let data;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    } catch (err) {
      this.errors.push({
        type: 'parse',
        message: `Failed to parse JSON: ${err.message}`
      });
      return this.getResult(filePath);
    }

    // Schema validation
    const valid = this.validate(data);
    if (!valid) {
      for (const error of this.validate.errors) {
        this.errors.push({
          type: 'schema',
          path: error.instancePath,
          message: error.message,
          params: error.params
        });
      }
    }

    // Business rule validation
    this.validateBusinessRules(data);

    return this.getResult(filePath);
  }

  /**
   * Validate business rules beyond JSON Schema
   */
  validateBusinessRules(data) {
    if (!data.data || !Array.isArray(data.data)) return;

    for (const wrapper of data.data) {
      if (!wrapper.data || !wrapper.data.course) continue;
      
      const course = wrapper.data.course;
      
      // Rule: Course must have at least one topic
      if (!course.contents || course.contents.length === 0) {
        this.warnings.push({
          type: 'business',
          path: '/data/0/data/course/contents',
          message: 'Course has no topics (sections)'
        });
      }

      // Rule: Each topic should have at least one content item
      if (course.contents) {
        for (let i = 0; i < course.contents.length; i++) {
          const topic = course.contents[i];
          if (!topic.children || topic.children.length === 0) {
            this.warnings.push({
              type: 'business',
              path: `/data/0/data/course/contents/${i}/children`,
              message: `Topic "${topic.post_title}" has no lessons or quizzes`
            });
          }

          // Rule: Topic post_parent should match course ID
          if (topic.post_parent !== course.ID) {
            this.errors.push({
              type: 'business',
              path: `/data/0/data/course/contents/${i}/post_parent`,
              message: `Topic "${topic.post_title}" has incorrect parent ID (${topic.post_parent}), expected ${course.ID}`
            });
          }

          // Validate children
          if (topic.children) {
            this.validateContentItems(topic.children, topic, i);
          }
        }
      }

      // Rule: Course should have at least one category
      if (!course.taxonomies?.categories || course.taxonomies.categories.length === 0) {
        this.warnings.push({
          type: 'business',
          path: '/data/0/data/course/taxonomies/categories',
          message: 'Course has no categories assigned'
        });
      }

      // Rule: Published courses should have a title
      if (course.post_status === 'publish' && (!course.post_title || course.post_title.trim() === '')) {
        this.errors.push({
          type: 'business',
          path: '/data/0/data/course/post_title',
          message: 'Published course must have a title'
        });
      }

      // Rule: Check for duplicate topic menu_order values
      if (course.contents && course.contents.length > 1) {
        const menuOrders = course.contents.map(t => t.menu_order);
        const duplicates = menuOrders.filter((item, index) => menuOrders.indexOf(item) !== index);
        if (duplicates.length > 0) {
          this.warnings.push({
            type: 'business',
            path: '/data/0/data/course/contents',
            message: `Duplicate topic menu_order values found: ${[...new Set(duplicates)].join(', ')}`
          });
        }
      }
    }
  }

  /**
   * Validate content items (lessons, quizzes, assignments)
   */
  validateContentItems(items, parentTopic, topicIndex) {
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const basePath = `/data/0/data/course/contents/${topicIndex}/children/${j}`;

      // Rule: Content item parent should match topic ID
      if (item.post_parent !== parentTopic.ID) {
        this.errors.push({
          type: 'business',
          path: `${basePath}/post_parent`,
          message: `Content item "${item.post_title}" has incorrect parent ID (${item.post_parent}), expected ${parentTopic.ID}`
        });
      }

      // Rule: Quiz must have questions
      if (item.post_type === 'tutor_quiz') {
        if (!item.question_answer || item.question_answer.length === 0) {
          this.warnings.push({
            type: 'business',
            path: `${basePath}/question_answer`,
            message: `Quiz "${item.post_title}" has no questions`
          });
        } else {
          this.validateQuizQuestions(item.question_answer, item, basePath);
        }
      }

      // Rule: Lesson should have content or video
      if (item.post_type === 'lesson') {
        const hasContent = item.post_content && item.post_content.trim() !== '';
        const hasVideo = item.meta?._video && 
                        Array.isArray(item.meta._video) && 
                        item.meta._video.length > 0 &&
                        typeof item.meta._video[0] === 'object' &&
                        Object.keys(item.meta._video[0]).length > 0;
        
        if (!hasContent && !hasVideo) {
          this.warnings.push({
            type: 'business',
            path: `${basePath}`,
            message: `Lesson "${item.post_title}" has no content or video`
          });
        }
      }
    }
  }

  /**
   * Validate quiz questions and answers
   */
  validateQuizQuestions(questions, quiz, basePath) {
    for (let k = 0; k < questions.length; k++) {
      const qa = questions[k];
      const questionPath = `${basePath}/question_answer/${k}`;

      // Rule: Question must have at least one answer (except open_ended)
      if (qa.question?.question_type !== 'open_ended') {
        const validAnswers = qa.answers?.filter(a => a.answer_id !== null) || [];
        if (validAnswers.length === 0) {
          this.errors.push({
            type: 'business',
            path: `${questionPath}/answers`,
            message: `Question "${qa.question?.question_title}" has no answers`
          });
        }

        // Rule: Multiple choice/single choice must have at least one correct answer
        if (['multiple_choice', 'single_choice', 'true_false'].includes(qa.question?.question_type)) {
          const correctAnswers = validAnswers.filter(a => a.is_correct === '1');
          if (correctAnswers.length === 0) {
            this.errors.push({
              type: 'business',
              path: `${questionPath}/answers`,
              message: `Question "${qa.question?.question_title}" has no correct answer marked`
            });
          }
        }

        // Rule: True/false should have exactly 2 answers
        if (qa.question?.question_type === 'true_false' && validAnswers.length !== 2) {
          this.warnings.push({
            type: 'business',
            path: `${questionPath}/answers`,
            message: `True/False question "${qa.question?.question_title}" should have exactly 2 answers, found ${validAnswers.length}`
          });
        }
      }

      // Rule: Question quiz_id should match parent quiz ID
      if (qa.question?.quiz_id && qa.question.quiz_id !== String(quiz.ID)) {
        this.errors.push({
          type: 'business',
          path: `${questionPath}/question/quiz_id`,
          message: `Question quiz_id (${qa.question.quiz_id}) doesn't match quiz ID (${quiz.ID})`
        });
      }
    }
  }

  getResult(filePath) {
    return {
      file: filePath,
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length
      }
    };
  }
}

/**
 * Format validation result for console output
 */
function formatResult(result) {
  const lines = [];
  const fileName = path.basename(result.file);
  
  if (result.valid && result.warnings.length === 0) {
    lines.push(`${colors.green}✓${colors.reset} ${fileName}`);
  } else if (result.valid) {
    lines.push(`${colors.yellow}⚠${colors.reset} ${fileName} ${colors.dim}(${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''})${colors.reset}`);
  } else {
    lines.push(`${colors.red}✗${colors.reset} ${fileName} ${colors.dim}(${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}, ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''})${colors.reset}`);
  }

  for (const error of result.errors) {
    lines.push(`  ${colors.red}ERROR${colors.reset} ${error.path || ''}: ${error.message}`);
  }

  for (const warning of result.warnings) {
    lines.push(`  ${colors.yellow}WARN${colors.reset}  ${warning.path || ''}: ${warning.message}`);
  }

  return lines.join('\n');
}

/**
 * Find all JSON files in a directory
 */
function findJsonFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
${colors.cyan}Tutor LMS Course Validator${colors.reset}

Usage:
  node validate-course.js <file.json>     Validate a single file
  node validate-course.js <directory>     Validate all JSON files in directory
  node validate-course.js --all           Validate all files in examples/

Options:
  --verbose, -v    Show detailed output
  --json           Output results as JSON
  --help, -h       Show this help
`);
    process.exit(0);
  }

  const scriptDir = __dirname;
  const projectRoot = path.dirname(scriptDir);
  const schemaPath = path.join(projectRoot, 'schemas', 'tutor-lms-course.schema.json');

  if (!fs.existsSync(schemaPath)) {
    console.error(`${colors.red}Error:${colors.reset} Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const validator = new CourseValidator(schemaPath);
  const results = [];
  let filesToValidate = [];

  // Determine files to validate
  if (args.includes('--all')) {
    const examplesDir = path.join(projectRoot, 'examples');
    if (fs.existsSync(examplesDir)) {
      filesToValidate = findJsonFiles(examplesDir);
    }
  } else {
    for (const arg of args) {
      if (arg.startsWith('-')) continue;
      
      const targetPath = path.resolve(arg);
      if (!fs.existsSync(targetPath)) {
        console.error(`${colors.red}Error:${colors.reset} Path not found: ${arg}`);
        continue;
      }

      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        filesToValidate.push(...findJsonFiles(targetPath));
      } else if (stat.isFile() && targetPath.endsWith('.json')) {
        filesToValidate.push(targetPath);
      }
    }
  }

  if (filesToValidate.length === 0) {
    console.error(`${colors.yellow}Warning:${colors.reset} No JSON files found to validate`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}Validating ${filesToValidate.length} file${filesToValidate.length !== 1 ? 's' : ''}...${colors.reset}\n`);

  // Validate each file
  for (const file of filesToValidate) {
    const result = validator.validateFile(file);
    results.push(result);
    console.log(formatResult(result));
  }

  // Summary
  const totalErrors = results.reduce((sum, r) => sum + r.summary.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.summary.warningCount, 0);
  const passedCount = results.filter(r => r.valid).length;

  console.log(`\n${colors.dim}─────────────────────────────────────${colors.reset}`);
  console.log(`${colors.cyan}Summary:${colors.reset} ${passedCount}/${results.length} files passed`);
  
  if (totalErrors > 0) {
    console.log(`${colors.red}Errors:${colors.reset} ${totalErrors}`);
  }
  if (totalWarnings > 0) {
    console.log(`${colors.yellow}Warnings:${colors.reset} ${totalWarnings}`);
  }

  // Output JSON if requested
  if (args.includes('--json')) {
    console.log('\n' + JSON.stringify(results, null, 2));
  }

  // Exit with error code if any validation failed
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
