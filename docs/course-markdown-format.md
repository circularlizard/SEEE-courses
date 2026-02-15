# Course markdown format

This document defines the intermediate markdown format used to author and review course content before conversion to Tutor LMS Pro JSON.

## File location

Each course has a `content.md` file alongside its JSON export:

```
courses/
  9362/
    content.md     ← human-authored course content
    9362.json      ← generated Tutor LMS export
  9748/
    content.md
    9748.json
```

## Document structure

A course document uses heading levels to mirror the Tutor LMS hierarchy:

| Heading level | Tutor LMS concept | Purpose |
|---|---|---|
| `#` | Course | Course title (exactly one per file) |
| `##` | Topic | Section grouping lessons and quizzes |
| `###` | Lesson / Quiz / Assignment | Individual content item |
| `####` | Question | Quiz question (inside a quiz block) |

## Front matter

YAML front matter holds course metadata that maps to JSON fields.

```yaml
---
course_id: 9362
post_name: navigation-foundations
status: draft
category: Bronze
level: beginner
duration:
  hours: 1
  minutes: 30
target_audience: >
  This course is designed for Explorers starting their DofE Bronze,
  looking to build the confidence to explore the countryside using
  established paths and tracks.
benefits:
  - Master the map: learn to read OS symbols and turn lines into a 3D mental picture.
  - Never get lost: use the 'corridor and stairs' method for pinpoint 6-figure grid references.
---
```

### Required front matter fields

| Field | Type | Description |
|---|---|---|
| `course_id` | integer | WordPress post ID from the JSON stub |
| `post_name` | string | URL slug |
| `status` | string | `draft`, `review`, or `final` |
| `category` | string | Course category: `Bronze`, `Silver`, or `Gold` |
| `level` | string | `beginner`, `intermediate`, or `expert` |
| `duration` | object | Estimated total duration (`hours`, `minutes`) |
| `target_audience` | string | Who the course is for |
| `benefits` | list | Learning outcomes (one per bullet) |

## Course description

The first paragraph(s) after the `#` heading and before the first `##` become the course `post_content`.

```markdown
# 3a. Navigation foundations

The Bronze Award is your first step into the world of independent exploration.
This module strips away the mystery of the paper map...
```

## Topics

A `##` heading starts a new topic. The paragraph immediately below becomes the topic `post_content` (summary).

```markdown
## The language of the map

We look at different kinds of map and help you convert 2D information
to a mental model of the real world.
```

## Lessons

A `### Lesson:` heading starts a lesson. Everything below it until the next `###` or `##` is the lesson body content, written in standard markdown.

```markdown
### Lesson: The spectrum of maps

<!-- duration: 6 -->
<!-- video: youtube https://www.youtube.com/watch?v=example -->

There are many different kinds of **map**, each designed for a different purpose.

Google Maps is brilliant for driving, but it strips away the detail
a walker needs...
```

### Lesson metadata comments

HTML comments at the top of a lesson hold metadata:

| Comment | Description |
|---|---|
| `<!-- duration: 6 -->` | Estimated lesson length in minutes |
| `<!-- video: SOURCE URL -->` | Video embed (source: `youtube`, `vimeo`, `html5`, `external_url`) |

### Lesson body content

Write lesson content using standard markdown:

- Paragraphs for explanatory text
- `**Bold**` for key terms on first use
- Bullet lists for groups of related items
- Numbered lists for sequential steps
- Block quotes for tips or callouts

Content will be converted to HTML for the JSON `post_content` field.

### Media placeholders

Use a dedicated syntax for images and media that need to be created or sourced:

```markdown
![Map comparison showing five different map types of the same hilltop](media/lesson-1-1-map-comparison.jpg)
<!-- MEDIA-TODO: 5-way split screen of the same hilltop across different map types -->
```

The `![alt](path)` gives the intended placement. The `MEDIA-TODO` comment describes what needs to be produced.

## Quizzes

A `### Quiz:` heading starts a quiz. Quiz-level settings go in HTML comments.

```markdown
### Quiz: The map decoder challenge

<!-- passing_grade: 80 -->
<!-- feedback_mode: retry -->
<!-- questions_order: rand -->
```

### Quiz settings

| Comment | Default | Description |
|---|---|---|
| `<!-- passing_grade: 80 -->` | `80` | Percentage required to pass |
| `<!-- feedback_mode: retry -->` | `retry` | `default`, `reveal`, or `retry` |
| `<!-- questions_order: rand -->` | `rand` | `rand`, `sorting`, `asc`, or `desc` |
| `<!-- attempts_allowed: 0 -->` | `0` | Number of attempts (`0` = unlimited) |

### Questions

Each `####` heading inside a quiz is a question. The question type is declared in an HTML comment.

```markdown
#### Match each symbol to its real-world photo.

<!-- type: matching -->
<!-- answer_required: true -->

- Path = Dashed green line
- Trig point = Blue triangle
- Church with tower = Black cross with square base
```

### Question types and answer format

**Single choice** — prefix the correct answer with `*`:

```markdown
#### 8cm on a 1:25,000 map represents how far on the ground?

<!-- type: single_choice -->

- 1km
- * 2km
- 4km
- 500m

> **Explanation:** At 1:25,000 scale, 4cm equals 1km, so 8cm equals 2km.
```

**Multiple choice** — prefix every correct answer with `*`:

```markdown
#### Which of these are linear map symbols?

<!-- type: multiple_choice -->

- * Footpath
- * Bridleway
- Trig point
- * Road
```

**True/false**:

```markdown
#### Grid north and magnetic north are the same thing.

<!-- type: true_false -->

- * False
- True
```

**Ordering** — list items in the correct order:

```markdown
#### Put the 6-figure grid reference steps in order.

<!-- type: ordering -->

1. Read the easting (left to right)
2. Estimate tenths across the square
3. Read the northing (bottom to top)
4. Estimate tenths up the square
```

**Matching** — use `=` to pair items:

```markdown
#### Match the landform to its contour pattern.

<!-- type: matching -->

- Valley = Contour V pointing uphill
- Spur = Contour V pointing downhill
- Summit = Closed concentric rings
```

**Open ended**:

```markdown
#### Describe the five Ds of a navigation leg.

<!-- type: open_ended -->

> **Explanation:** The five Ds are Destination, Distance, Direction, Description, and Dangers.
```

**Fill in the blank** — use `{blank}` markers:

```markdown
#### At 1:25,000 scale, {blank}cm on the map equals 1km on the ground.

<!-- type: fill_in_the_blank -->

- 4
```

**Image answering** — describe the image and expected interaction:

```markdown
#### Click on the symbol for a path you are legally allowed to ride a bike on.

<!-- type: image_answering -->
<!-- MEDIA-TODO: Map snippet showing various path symbols -->
```

### Answer explanations

A block quote starting with `**Explanation:**` after the answer list becomes the `answer_explanation` field.

```markdown
> **Explanation:** A bridleway (long dashes) permits cycling, unlike a footpath (short dashes).
```

## Assignments

A `### Assignment:` heading starts an assignment.

```markdown
### Assignment: Complete your route card

<!-- total_mark: 10 -->
<!-- pass_mark: 7 -->
<!-- upload_files_limit: 1 -->

Upload a completed route card for a 5km walk in your local area.
```

## Complete minimal example

```markdown
---
course_id: 9362
post_name: navigation-foundations
status: draft
category: Bronze
level: beginner
duration:
  hours: 1
  minutes: 30
target_audience: >
  Explorers starting their DofE Bronze.
benefits:
  - Read OS map symbols confidently.
  - Provide accurate 6-figure grid references.
---

# 3a. Navigation foundations

Your first step into independent exploration.

## The language of the map

Different kinds of map and how to read them.

### Lesson: The spectrum of maps

<!-- duration: 6 -->

There are many different kinds of **map**...

### Quiz: The map decoder challenge

<!-- passing_grade: 80 -->

#### 8cm on a 1:25,000 map represents how far on the ground?

<!-- type: single_choice -->

- 1km
- * 2km
- 4km

> **Explanation:** At 1:25,000 scale, 4cm equals 1km.
```

## Conversion workflow

1. Author or edit `content.md`
2. Review with subject-matter expert (status: `review`)
3. Mark as `final`
4. Run converter script to produce the Tutor LMS JSON
5. Validate JSON with `npm run validate:all`
