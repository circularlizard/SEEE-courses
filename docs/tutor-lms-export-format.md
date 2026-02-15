# Tutor LMS Pro Course Export Format

This document describes the JSON export format used by Tutor LMS Pro (schema version 2.0.0) for course exports. This format is used when exporting courses from the WordPress LMS plugin.

## Overview

A Tutor LMS course export is a JSON file containing a complete course structure including:
- Course metadata and settings
- Topics (sections/modules)
- Lessons with content and videos
- Quizzes with questions and answers
- Assignments

## Top-Level Structure

```json
{
  "schema_version": "2.0.0",
  "exported_at": "15 February, 2026 12:25",
  "keep_media_files": false,
  "keep_user_data": false,
  "data": [...]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | Always `"2.0.0"` for this format |
| `exported_at` | string | Human-readable export timestamp |
| `keep_media_files` | boolean | Whether media files are included |
| `keep_user_data` | boolean | Whether user enrollment data is included |
| `data` | array | Array of content wrappers (usually one course) |

## Content Wrapper

Each item in the `data` array wraps a course:

```json
{
  "content_type": "courses",
  "data": {
    "course": { ... }
  }
}
```

## Course Object

The course object contains all course information:

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | integer | WordPress post ID |
| `post_author` | string | Author user ID |
| `post_date` | string | Creation date (`YYYY-MM-DD HH:MM:SS`) |
| `post_title` | string | Course title |
| `post_status` | string | `publish`, `draft`, `pending`, or `private` |
| `post_type` | string | Always `"courses"` |
| `meta` | object | Course metadata and settings |
| `taxonomies` | object | Categories and tags |
| `contents` | array | Topics (sections) containing lessons |

### Course Meta

The `meta` object contains Tutor LMS-specific settings:

```json
{
  "_tutor_course_price_type": ["free"],
  "_tutor_course_settings": [{
    "maximum_students": 0,
    "enrollment_expiry": "",
    "enable_content_drip": 1,
    "content_drip_type": "unlock_sequentially",
    "enable_tutor_bp": 0,
    "course_enrollment_period": "no",
    "enrollment_starts_at": "",
    "enrollment_ends_at": "",
    "pause_enrollment": "no"
  }],
  "_tutor_enable_qa": ["yes"],
  "_tutor_is_public_course": ["no"],
  "_course_duration": [{
    "hours": "0",
    "minutes": "15"
  }],
  "_tutor_course_level": ["beginner"],
  "_tutor_course_benefits": ["Benefit 1\r\nBenefit 2"]
}
```

| Meta Key | Description |
|----------|-------------|
| `_tutor_course_price_type` | `"free"` or `"paid"` |
| `_tutor_course_settings` | Course enrollment and drip settings |
| `_tutor_enable_qa` | Enable Q&A section (`"yes"` / `"no"`) |
| `_tutor_is_public_course` | Public access without enrollment |
| `_course_duration` | Estimated course duration |
| `_tutor_course_level` | `"all_levels"`, `"beginner"`, `"intermediate"`, `"expert"` |
| `_tutor_course_benefits` | Learning outcomes (newline-separated) |
| `_tutor_course_target_audience` | Target audience description |

### Content Drip Types

| Value | Description |
|-------|-------------|
| `""` (empty) | No content drip |
| `unlock_sequentially` | Unlock content in order |
| `specific_days` | Unlock after specific days |
| `after_finishing_prerequisites` | Unlock after completing prerequisites |

## Topics (Sections)

Topics are sections within a course that group related content:

```json
{
  "ID": 9344,
  "post_title": "Expedition Requirements",
  "post_type": "topics",
  "post_parent": 9229,
  "menu_order": 1,
  "children": [...]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ID` | integer | Topic post ID |
| `post_title` | string | Section title |
| `post_type` | string | Always `"topics"` |
| `post_parent` | integer | Parent course ID |
| `menu_order` | integer | Display order (1-based) |
| `children` | array | Lessons, quizzes, and assignments |

## Content Items

Content items are the children of topics and can be lessons, quizzes, or assignments.

### Lessons

```json
{
  "ID": 9345,
  "post_title": "Preparing for the expedition",
  "post_type": "lesson",
  "post_content": "<h2>Basic Requirements</h2>...",
  "post_parent": 9344,
  "menu_order": 0,
  "meta": {
    "_video": [{
      "source": "youtube",
      "source_youtube": "https://www.youtube.com/watch?v=...",
      "runtime": { "hours": "00", "minutes": "1", "seconds": "11" },
      "playtime": "1:11"
    }],
    "_tutor_attachments": [["9378"]]
  }
}
```

#### Video Sources

| Source | Field | Description |
|--------|-------|-------------|
| `youtube` | `source_youtube` | YouTube URL |
| `vimeo` | `source_vimeo` | Vimeo URL |
| `html5` | `source_html5` | Direct video URL |
| `external_url` | `source_external_url` | External video URL |
| `shortcode` | `source_shortcode` | WordPress shortcode |
| `embedded` | `source_embedded` | Embed code |

### Quizzes

```json
{
  "ID": 9382,
  "post_title": "Expedition requirements quiz",
  "post_type": "tutor_quiz",
  "post_parent": 9381,
  "menu_order": 1,
  "meta": {
    "tutor_quiz_option": [{
      "attempts_allowed": "0",
      "feedback_mode": "retry",
      "passing_grade": "80",
      "questions_order": "rand",
      "time_limit": { "time_type": "minutes", "time_value": "0" }
    }]
  },
  "question_answer": [...]
}
```

#### Quiz Options

| Option | Description |
|--------|-------------|
| `attempts_allowed` | `"0"` = unlimited |
| `feedback_mode` | `"default"`, `"reveal"`, `"retry"` |
| `passing_grade` | Percentage required to pass |
| `questions_order` | `"rand"`, `"sorting"`, `"asc"`, `"desc"` |
| `time_limit.time_value` | `"0"` = no time limit |

#### Question Types

| Type | Description |
|------|-------------|
| `true_false` | True/False question |
| `single_choice` | Single correct answer |
| `multiple_choice` | Multiple correct answers possible |
| `open_ended` | Free text response |
| `fill_in_the_blank` | Fill in missing words |
| `short_answer` | Short text response |
| `matching` | Match items |
| `image_matching` | Match images |
| `image_answering` | Answer with images |
| `ordering` | Put items in order |

#### Question/Answer Structure

```json
{
  "question": {
    "question_id": "1",
    "quiz_id": "9382",
    "question_title": "Which of the following are NOT consistent with requirements?",
    "question_type": "multiple_choice",
    "question_mark": "1.00",
    "answer_explanation": "Explanation shown after answering",
    "question_settings": {
      "answer_required": "0",
      "randomize_question": "1",
      "has_multiple_correct_answer": "1"
    }
  },
  "answers": [
    {
      "answer_id": "1",
      "answer_title": "Answer text",
      "is_correct": "1",
      "answer_view_format": "text"
    }
  ]
}
```

### Assignments

```json
{
  "ID": 9546,
  "post_title": "Do the online learning",
  "post_type": "tutor_assignments",
  "post_parent": 9411,
  "meta": {
    "_tutor_course_id_for_assignments": ["9363"],
    "assignment_option": [{
      "time_duration": { "time": "weeks", "value": 0 },
      "total_mark": "1",
      "pass_mark": "1",
      "upload_files_limit": "1",
      "upload_file_size_limit": "5",
      "is_retry_allowed": "1",
      "attempts_allowed": "5"
    }]
  }
}
```

## Taxonomies

Courses can be assigned to categories and tags:

```json
{
  "categories": [
    {
      "term_id": 48,
      "name": "Bronze",
      "slug": "bronze",
      "taxonomy": "course-category",
      "description": "Materials targeted at bronze award participants."
    }
  ],
  "tags": []
}
```

## Validation

Use the provided JSON Schema and validation tool to validate course exports:

```bash
cd scripts
npm install
npm run validate:all
```

The validator checks:
- **Schema compliance**: Structure matches the JSON Schema
- **Business rules**: 
  - Parent/child ID relationships are correct
  - Quizzes have questions with correct answers
  - Topics have content items
  - Lessons have content or video

## Creating New Courses

When creating a new course export from scratch:

1. Use `schema_version: "2.0.0"`
2. Ensure all `post_parent` values correctly reference parent IDs
3. Use sequential `menu_order` values (1-based for topics, 0-based for content items)
4. Include required meta fields (`_tutor_course_price_type`, `_tutor_course_settings`)
5. For quizzes, ensure `quiz_id` in questions matches the quiz `ID`
6. Mark at least one answer as correct (`is_correct: "1"`) for choice questions

## File Naming Convention

Export files are typically named with the course ID:
- `9229/9229.json` - Course ID 9229
- `9360/9360.json` - Course ID 9360
