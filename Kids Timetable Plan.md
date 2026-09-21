# Kids Timetable Web App — Product & Implementation Plan

## 1. Product vision

Build a responsive web app for parents to manage school timetables and extra-class schedules for one or multiple children.

The key concept is:

**Child → Timetable Version → Effective Date Range → Calendar Date → Resolved Daily Schedule**

The app must not treat a timetable as one permanent schedule. A child can have multiple timetable versions over time: semester changes, new school year, class changes, teacher changes, temporary schedules, etc.

The visual target is **a beautiful, lively timetable that feels like the generated A4 infographic**, not an ERP spreadsheet. The entire application must use one coherent design system, while allowing the user to switch between visual themes such as:

- Cute / Lovely
- Modern / Clean
- Pastel
- Colorful
- Minimal
- Future themes

The theme changes the visual language of the entire application, not only the timetable.

---

# 2. Core product model

## 2.1 Child

A parent can manage multiple children.

Example:

- Bé An — THCS Tô Hiệu — 6A5
- Bé Bình — Primary School — 3A2

Each child has independent:

- school timetable
- timetable versions
- extra classes
- exceptions
- calendar
- visual preferences if desired

---

## 2.2 Timetable version

A timetable is a **version with an effective period**, not simply a weekly grid.

Example:

### TKB 6A5 — HK1

- Child: Bé An
- School year: 2026–2027
- Semester: HK1
- Valid from: 21/09/2026
- Valid to: 31/12/2026
- Status: Active

### TKB 6A5 — HK2

- Child: Bé An
- School year: 2026–2027
- Semester: HK2
- Valid from: 01/01/2027
- Valid to: 31/05/2027
- Status: Active

Historical timetable versions must never be overwritten.

---

# 3. The most important interaction: Calendar → Timetable

The Calendar is the time navigation layer.

The user selects:

1. Child
2. Month
3. Date

Example:

```text
September 2026

Mon Tue Wed Thu Fri Sat Sun
     1   2   3   4   5   6
 7   8   9  10  11  12  13
14  15  16  17  18  19  20
21  22  23  24  25  26  27
28  29  30
```

When the user clicks 21/09/2026:

```text
resolveSchedule(childId, "2026-09-21")
```

The application must:

1. Find the timetable version whose:
   `valid_from <= selected_date`
   AND
   `valid_to >= selected_date`
2. Find weekly entries matching Monday.
3. Apply any date-specific exception.
4. Load extra classes valid for that date.
5. Return a normalized daily schedule.
6. Display the result in Morning / Afternoon / Evening sections.

The UI must not contain this business logic.

---

# 4. Schedule resolution priority

Use this priority:

```text
1. Date-specific exception
2. Date-specific custom schedule
3. Active timetable version
4. Weekly timetable entry
5. Extra schedule
```

Create one domain/service function:

```ts
resolveSchedule(childId, date)
```

Example result:

```ts
{
  child,
  date,
  timetable,
  morning: [],
  afternoon: [],
  evening: [],
  extraSchedules: [],
  exceptions: []
}
```

This function becomes the single source of truth for calendar/day views.

---

# 5. School timetable data model

## children

```text
id
name
nickname
date_of_birth
school_name
grade
class_name
avatar_url
color
active
created_at
updated_at
```

## timetable_templates

```text
id
child_id
name
description
school_year
semester
valid_from
valid_to
status
created_at
updated_at
```

Status:

- draft
- active
- archived

## timetable_entries

```text
id
timetable_id
weekday
period
session
start_time
end_time
subject
teacher
room
note
color
```

Example:

```text
Monday
Period 1
Morning
Chào cờ
M. Dung
```

---

# 6. Extra-class model

Extra classes are intentionally separate from the school timetable.

The user wants extra classes summarized by session, not broken into school-style periods.

Current example:

### Toán

- Thứ 2: 19:15–21:15
- Thứ 5: 19:15–21:15

### Tiếng Anh

- Thứ 4: 17:15–19:15
- Thứ 7: 19:30–21:30

### Tiếng Anh phụ đạo

- Thứ 6: 19:30–21:30
- OR Chủ nhật: 08:00–10:00

Database:

## extra_schedules

```text
id
child_id
name
category
weekday
session
start_time
end_time
valid_from
valid_to
note
color
active
```

The UI should display:

```text
🌞 BUỔI SÁNG
School timetable

☀️ BUỔI CHIỀU
School timetable

🌙 BUỔI TỐI
Extra classes
```

Do not force extra classes into Period 1 / Period 2 / Period 3.

---

# 7. Schedule exceptions

Support individual-date changes without changing the weekly timetable.

Examples:

- No class on a specific date
- Teacher substitution
- Different start time
- Moved class
- Extra one-time class

## schedule_exceptions

```text
id
child_id
date
timetable_entry_id
type
subject
teacher
start_time
end_time
note
```

Types:

- cancel
- replace
- custom

Example:

```text
05/10/2026
Toán
19:15–21:15
→ Cancelled
```

The original weekly timetable remains unchanged.

---

# 8. Timetable editor

The editor should feel like a **visual timetable builder**, not a database form.

Desktop:

```text
                 T2       T3       T4       T5       T6

Tiết 1           [ ]      [ ]      [ ]      [ ]      [ ]

Tiết 2           [ ]      [ ]      [ ]      [ ]      [ ]

Tiết 3           [ ]      [ ]      [ ]      [ ]      [ ]

Tiết 4           [ ]      [ ]      [ ]      [ ]      [ ]
```

Clicking a cell opens a compact editor:

```text
Môn
[ Ngữ văn ]

Giáo viên
[ Hiếu ]

Phòng
[ ]

Thời gian
[ 08:45 ] → [ 09:30 ]

Ghi chú
[ ]

[ Lưu ]
```

Support:

- click-to-edit
- duplicate entry
- clear cell
- copy row
- copy day
- duplicate timetable
- drag-and-drop where appropriate
- undo/redo if feasible

---

# 9. A4 infographic-inspired timetable UI

This is a major product requirement.

The timetable must visually resemble a polished educational infographic:

- landscape composition
- strong title/header
- colorful day columns
- rounded subject cards
- separate Morning / Afternoon / Evening sections
- subject-specific colors
- teacher name under subject
- friendly icons
- soft backgrounds
- visual hierarchy
- decorative but restrained illustrations
- motivational micro-copy
- clear whitespace
- print-friendly layout

Example visual hierarchy:

```text
┌─────────────────────────────────────────────────────────────┐
│              🌟 THỜI KHÓA BIỂU — BÉ AN                     │
│                    LỚP 6A5                                  │
│                 Năm học 2026–2027                           │
├──────────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┤
│          │  T2  │  T3  │  T4  │  T5  │  T6  │  T7  │  CN   │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
│ 🌞 SÁNG  │ 📘   │ 📐   │ 📖   │ 🎨   │ 🔬   │      │       │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
│ ☁️ CHIỀU │ ...  │ ...  │ ...  │ ...  │ ...  │      │       │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
│ 🌙 TỐI   │ Toán │      │ Anh  │ Toán │ PT   │ Anh  │ Anh   │
└──────────┴──────┴──────┴──────┴──────┴──────┴──────┴───────┘
```

This is a design reference, not a hardcoded layout.

---

# 10. One global design language

The application must have a **Design System**.

Do not design each page independently.

Create reusable tokens:

```text
Design Tokens
├── colors
├── typography
├── spacing
├── radius
├── shadows
├── borders
├── icons
├── illustrations
├── card styles
├── button styles
├── calendar styles
├── timetable styles
└── motion
```

Every page must consume these tokens.

Pages:

- Dashboard
- Calendar
- Timetable
- Timetable Editor
- Children
- Extra Classes
- Settings

must look like one application.

---

# 11. Theme system

The user must be able to choose a global visual theme.

Initial themes:

## Theme 1 — Cute / Lovely

Characteristics:

- pastel colors
- rounded cards
- playful icons
- soft shadows
- cute illustrations
- sticker-like accents
- cheerful typography

Best for younger children.

## Theme 2 — Modern

Characteristics:

- clean white/neutral surfaces
- stronger typography
- subtle accent colors
- minimal decoration
- compact cards
- modern dashboard

Best for older children and parents.

## Theme 3 — Pastel

Characteristics:

- soft pastel palette
- low visual contrast
- gentle backgrounds
- calm cards
- light illustrations

## Theme 4 — Colorful

Characteristics:

- stronger subject colors
- bright day headers
- playful timetable
- energetic visual hierarchy

The architecture must allow future themes without rewriting components.

---

# 12. Theme architecture

Do NOT hardcode colors directly inside components.

Use semantic tokens:

```ts
theme.colors.primary
theme.colors.secondary
theme.colors.background
theme.colors.surface
theme.colors.text
theme.colors.muted
theme.colors.success
theme.colors.warning
theme.colors.error

theme.timetable.morning
theme.timetable.afternoon
theme.timetable.evening

theme.subject.math
theme.subject.english
theme.subject.literature
theme.subject.science
```

Components should use semantic tokens instead of fixed hex values.

Example:

```tsx
<Card className="timetable-card">
```

The theme controls:

- background
- border
- radius
- shadow
- typography
- icon treatment
- subject colors
- decorative elements

---

# 13. Theme preview UI

Settings:

```text
Appearance

Choose your style

┌─────────────┐
│ 🌸 Cute     │
│ [Preview]   │
└─────────────┘

┌─────────────┐
│ ✨ Modern   │
│ [Preview]   │
└─────────────┘

┌─────────────┐
│ 🌈 Colorful │
│ [Preview]   │
└─────────────┘

┌─────────────┐
│ ☁ Pastel   │
│ [Preview]   │
└─────────────┘
```

Changing the theme should update the entire application immediately.

Persist the selected theme.

---

# 14. Subject color system

Subjects should have consistent semantic colors.

Example:

```text
Toán          → math token
Tiếng Anh     → english token
Ngữ văn       → literature token
KHTN          → science token
GDTC          → physical-education token
Âm nhạc       → music token
Mĩ thuật      → art token
Tin           → technology token
```

Do not assign random colors independently on each page.

A theme may change the actual color palette while preserving subject identity.

---

# 15. Illustrations and decorative layer

The timetable should be lively, but decorations must not interfere with readability.

Use reusable decorative components:

```text
<ThemeIllustration />
<MotivationBanner />
<SubjectIcon />
<SectionIcon />
<Sticker />
<DecorativeShape />
```

Examples:

- books
- pencils
- stars
- clouds
- sun
- moon
- plants
- school icons
- small child-friendly illustrations

The illustration layer should be optional.

A Modern theme can reduce decorations significantly.

---

# 16. Information hierarchy

Decorations must never overpower timetable information.

Priority:

```text
1. Subject
2. Time
3. Teacher
4. Day
5. Session
6. Room
7. Notes
8. Decoration
```

A child/parent should understand the schedule in less than a few seconds.

---

# 17. Timetable card design

Each lesson should be a reusable component:

```text
<LessonCard />
```

Example:

```text
┌───────────────────────┐
│ 📘                     │
│ Ngữ văn                │
│ Hiếu                   │
│ 08:45 – 09:30          │
└───────────────────────┘
```

Different themes can render the same information differently.

Cute:

```text
rounded + pastel + sticker
```

Modern:

```text
compact + clean + subtle border
```

Colorful:

```text
strong subject color + icon
```

---

# 18. Dashboard

The home screen should show:

- selected child
- today's date
- today's school schedule
- today's extra classes
- next class
- tomorrow preview
- active timetable
- quick calendar access

Example:

```text
TODAY
Monday — 21/09/2026

🌞 MORNING
07:00 Chào cờ — M. Dung
08:45 Ngữ văn — Hiếu
09:50 GDTC — Lê Minh
10:55 Âm nhạc — Lê Minh

☁️ AFTERNOON
13:30 TANN — GVNN
14:35 KNS — M. Dung

🌙 EVENING
19:15–21:15 Toán
```

---

# 19. Calendar design

Calendar should visually show schedule availability.

Possible indicators:

- 🟢 school timetable
- 🔵 extra class
- 🟡 schedule changed
- 🔴 cancelled
- ⭐ today

Avoid clutter.

On desktop:

- month calendar on left/top
- selected-day schedule on right/below

On mobile:

- month calendar
- selected-day schedule underneath

---

# 20. Child selector

Global selector:

```text
👧 Bé An ▼
```

Switching children updates:

- dashboard
- calendar
- timetable
- extra schedules
- exceptions

Never mix child data.

---

# 21. Navigation

Desktop:

```text
Dashboard
Calendar
Timetable
Extra Classes
Children
Settings
```

Mobile:

```text
Home
Calendar
Timetable
Children
More
```

Mobile navigation MUST remain accessible.

Do not simply hide the desktop sidebar and leave the user without navigation.

---

# 22. Responsive requirements

Must work at:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px+

Use responsive composition, not simple shrinking.

Timetable behavior:

Desktop:
- full weekly grid

Tablet:
- horizontally scrollable timetable with sticky first column

Mobile:
- selected day / vertical cards
- optional week horizontal scroll
- no unreadable 7-column compressed grid

The timetable must remain usable rather than merely fitting the viewport.

---

# 23. Database relationships

```text
USER
 │
 └── CHILDREN
       │
       ├── TIMETABLE_TEMPLATES
       │       │
       │       └── TIMETABLE_ENTRIES
       │
       ├── EXTRA_SCHEDULES
       │
       └── SCHEDULE_EXCEPTIONS
```

Theme preference:

```text
USER
 └── appearance_settings
       ├── theme
       ├── density
       └── optional child-specific theme
```

---

# 24. Security

Use Supabase RLS.

A user can access only their own:

- children
- timetable templates
- timetable entries
- extra schedules
- exceptions
- settings

Never rely only on frontend filtering.

---

# 25. Validation

Prevent:

- valid_from > valid_to
- overlapping active timetable versions
- invalid time ranges
- duplicate period entries
- orphan entries
- extra schedule without child
- timetable entry without timetable

Show clear user-friendly warnings.

---

# 26. Recommended architecture

Frontend:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- date-fns
- Zod
- MUI or Tailwind

Backend:

- Supabase
- PostgreSQL
- Supabase Auth
- RLS

Suggested structure:

```text
src/
  app/
  components/
  design-system/
    tokens/
    themes/
    components/
    icons/
    illustrations/
  features/
    children/
    dashboard/
    calendar/
    timetable/
    extra-schedule/
    settings/
  domain/
    timetable/
    calendar/
    schedule-resolution/
  services/
  hooks/
  types/
  utils/
```

The `design-system` folder is mandatory.

---

# 27. Design system implementation

Create:

```text
ThemeProvider
ThemeContext
theme tokens
theme presets
```

Example:

```ts
type AppTheme =
  | "cute"
  | "modern"
  | "pastel"
  | "colorful";
```

Each theme defines:

```ts
{
  colors,
  typography,
  spacing,
  radius,
  shadows,
  components,
  timetable,
  decorations,
  motion
}
```

Components consume semantic tokens.

Never:

```tsx
background: "#FFB6C1"
```

inside random components.

Prefer:

```tsx
background: theme.colors.surfaceAccent
```

---

# 28. Print / A4

The final timetable must support:

- A4 landscape
- print preview
- clean print CSS
- no navigation in print
- no unnecessary controls
- preserve subject colors
- preserve teacher names
- fit on one page where possible

The printed result should visually resemble a polished educational infographic.

---

# 29. Copy / Duplicate timetable

A critical productivity feature.

Flow:

```text
TKB HK1
   ↓
Duplicate
   ↓
TKB HK2
   ↓
Change dates
   ↓
Edit only changed lessons
```

Never require users to rebuild an entire semester manually.

---

# 30. Development phases

## Phase 1 — Foundation

- React/Vite/TypeScript
- Supabase
- Auth
- database schema
- RLS
- routing
- responsive shell
- design system foundation
- theme provider

## Phase 2 — Children

- CRUD children
- child selector
- profile
- school/class information

## Phase 3 — Timetable

- timetable CRUD
- effective date range
- weekly editor
- subject
- teacher
- room
- duplicate timetable
- timetable cards

## Phase 4 — Calendar

- month calendar
- date selection
- schedule resolution
- daily schedule
- week view

## Phase 5 — Extra classes

- recurring schedule
- morning/afternoon/evening
- date range
- optional schedule
- exceptions

## Phase 6 — Visual system

- Cute theme
- Modern theme
- Pastel theme
- Colorful theme
- theme preview
- illustrations
- animation
- polished timetable infographic

## Phase 7 — Print / PWA

- A4 landscape
- print CSS
- PDF/export
- PWA
- offline-friendly read access if feasible

---

# 31. Testing

Create unit/integration tests for:

1. One child.
2. Multiple children.
3. Date inside timetable range.
4. Date before timetable.
5. Date after timetable.
6. Semester transition.
7. Two timetable versions.
8. Exception.
9. Cancelled lesson.
10. Extra class.
11. Optional Sunday tutoring.
12. Theme switching.
13. Mobile navigation.
14. Responsive timetable rendering.

Critical test:

```text
Child A
TKB 1:
01/09 → 31/12

TKB 2:
01/01 → 31/05

09/21 → TKB 1
01/15 → TKB 2
```

---

# 32. MVP acceptance criteria

The MVP is complete when:

1. User logs in.
2. User creates a child.
3. User creates a timetable version.
4. User sets valid_from and valid_to.
5. User enters weekly school timetable.
6. User enters teachers.
7. User adds extra classes.
8. User opens Calendar.
9. User selects a month.
10. User clicks a date.
11. Correct timetable version is automatically selected.
12. Daily schedule is grouped into Morning / Afternoon / Evening.
13. Extra classes are displayed separately.
14. A second timetable version can be created for a later period.
15. Calendar automatically switches to the correct version.
16. A date-specific exception can override the normal timetable.
17. User can switch children.
18. User can switch application themes.
19. All major screens share the same design language.
20. Mobile navigation remains usable.
21. Timetable looks like a polished infographic, not an ERP table.

---

# 33. Important product principle

The application has TWO layers:

## Functional layer

```text
Child
Timetable
Calendar
Schedule Resolution
Extra Classes
Exceptions
```

## Visual layer

```text
Design System
Theme
Typography
Color
Illustrations
Icons
Cards
Motion
Layout
```

The functional layer must never depend on one visual theme.

A new theme must be able to completely change the visual appearance while using the same timetable/calendar components and data.

This separation is essential for future expansion.

---

# 34. Final implementation principle

Do not build:

"one timetable page with some calendar features."

Build:

**A reusable family scheduling platform with a beautiful child-focused visual system.**

The timetable is the primary visual product.

The calendar determines which timetable version applies to a specific date.

The child determines whose timetable is being displayed.

The effective date determines which timetable version is active.

The theme determines how the entire application looks.

Core relationship:

```text
WHO?
  ↓
Child

WHEN?
  ↓
Calendar Date

WHICH VERSION?
  ↓
Effective Timetable

WHAT?
  ↓
Daily Schedule

HOW DOES IT LOOK?
  ↓
Global Theme / Design System
```

This architecture must be implemented before adding secondary features.


# 35. Child Achievement & Academic Performance Management

The application must also manage each child's academic performance and achievements.

This is a separate major domain from the timetable.

Core concept:

```text
Child
  ↓
Academic Year / Grade
  ↓
Assessment Plan
  ↓
Assessment Event
  ↓
Assessment Result
  ↓
Target Score
  ↓
Achievement Record
  ↓
Historical Performance
```

The purpose is not only to store scores, but to answer:

- What assessments are planned?
- What was the target?
- What was the actual result?
- How did the child improve over time?
- What achievements has the child collected?
- How does the current result compare with previous years?
- What is the child's ranking when an official ranking is available?
- Which subjects are improving or declining?

---

# 36. Assessment Plan

Parents should be able to create planned assessment periods/events.

Examples:

```text
2026–2027
├── Khảo sát đầu năm
├── Kiểm tra giữa HK1
├── Kiểm tra cuối HK1
├── Khảo sát giữa HK2
└── Tổng kết cuối năm
```

## assessment_plans

```text
id
child_id
school_year
grade
name
type
planned_date
start_date
end_date
description
status
created_at
updated_at
```

Types can include:

- diagnostic
- monthly
- midterm
- final
- school_exam
- external_exam
- mock_exam
- other

Status:

- planned
- completed
- cancelled

The system must allow future assessment plans to exist before results are entered.

---

# 37. Assessment Result

Each assessment can contain multiple subject results.

Example:

```text
Khảo sát giữa HK1
────────────────────────
Toán        8.5
Ngữ văn     8.0
Tiếng Anh   9.0
KHTN        8.5

Average     8.50
```

## assessments

```text
id
assessment_plan_id
child_id
actual_date
overall_score
overall_target
rank
rank_scope
rank_total
percentile
comment
status
```

## assessment_subject_results

```text
id
assessment_id
subject
score
max_score
target_score
previous_score
rank
comment
```

Do not assume every assessment uses a 10-point scale.

Support:

```text
score = 8.5
max_score = 10
```

or:

```text
score = 85
max_score = 100
```

or other scales.

Store the raw score and maximum score, then calculate normalized percentages where appropriate.

---

# 38. Target Management

Parents should be able to set targets.

Targets can exist at:

1. Assessment level
2. Subject level
3. School-year level
4. Achievement level

Example:

```text
HK1 Target

Toán
Target: 9.0

Tiếng Anh
Target: 9.2

Ngữ văn
Target: 8.5
```

## performance_targets

```text
id
child_id
school_year
semester
subject
target_type
target_value
start_date
end_date
note
status
```

Target types:

- score
- average
- rank
- achievement
- custom

The UI should clearly distinguish:

```text
TARGET
9.0

ACTUAL
8.5

GAP
-0.5
```

Do not interpret the gap as a judgment; it is simply a measurable difference.

---

# 39. Achievement Records

Create a dedicated achievement record system.

Examples:

```text
🏆 Học sinh tiêu biểu
🥇 Giải Nhất Toán
🥈 Giải Nhì Tiếng Anh
📜 Chứng chỉ Cambridge
🎖 Hoàn thành mục tiêu đọc sách
⭐ Thành tích học tập
```

## achievement_records

```text
id
child_id
date
school_year
category
title
description
level
result
organization
subject
score
rank
certificate_url
image_url
note
created_at
updated_at
```

Categories:

- academic
- competition
- certificate
- sports
- arts
- reading
- behavior
- project
- personal_goal
- other

The system should support attaching a certificate/image when available.

---

# 40. Ranking / Position

Ranking must be treated as **recorded data**, not something the application invents.

Support:

```text
rank
rank_total
rank_scope
```

Examples:

```text
Rank: 3
Total: 42
Scope: Class 6A5
```

or:

```text
Rank: 12
Total: 180
Scope: Grade 6
```

or:

```text
Rank: 2
Total: 35
Scope: Competition
```

Important:

If an official rank is not available, do NOT calculate or display a school/class rank as if it were official.

If the parent wants an internal comparison among children in the family, this must be clearly labeled as:

`Family comparison`

and must never be confused with official school ranking.

---

# 41. Performance History

Create a longitudinal performance view.

The purpose is to see changes across years.

Example:

```text
Academic Performance

Year       Average    Rank
────────────────────────────
2024–25     8.1       15/42
2025–26     8.5       8/40
2026–27     8.7       5/41
```

Also provide subject trends:

```text
Toán

8.0 ───── 8.4 ───── 8.8 ───── 9.1

2024      2025      2026      2027
```

Possible metrics:

- average score
- subject score
- target achievement
- rank
- percentile
- number of achievements
- number of certificates
- competition results

The application must distinguish between:

**Actual recorded results**

and

**Derived metrics calculated from recorded results.**

---

# 42. Performance Dashboard

Add a new main navigation item:

```text
Performance
```

Suggested structure:

```text
┌─────────────────────────────────────────────┐
│ 👧 Bé An                                    │
│ Academic Performance                        │
├─────────────────────────────────────────────┤
│                                             │
│ Current Average          Target             │
│ 8.7                      9.0                │
│                                             │
│ Latest Assessment       Rank                │
│ 8.8                     5 / 41              │
│                                             │
├─────────────────────────────────────────────┤
│ 📈 PERFORMANCE TREND                        │
│                                             │
│ 2024 ── 2025 ── 2026 ── 2027              │
│                                             │
├─────────────────────────────────────────────┤
│ 📚 SUBJECT PERFORMANCE                      │
│                                             │
│ Toán        9.1      ↑                      │
│ English     9.0      ↑                      │
│ Văn         8.4      →                      │
│ KHTN        8.6      ↑                      │
├─────────────────────────────────────────────┤
│ 🏆 ACHIEVEMENTS                             │
│                                             │
│ 🥇 Giải Nhất Toán                           │
│ 📜 Cambridge Certificate                    │
│ ⭐ Học sinh tiêu biểu                       │
└─────────────────────────────────────────────┘
```

The visual design must use the same global Design System and selected theme.

---

# 43. Assessment Calendar Integration

Assessment plans should integrate with the existing Calendar.

Calendar indicators:

```text
📚 School timetable
📝 Assessment
🏆 Achievement
🔵 Extra class
```

Example:

```text
September 2026

21   22   23   24   25   26   27
🟢   🟢   📝   🟢   🟢   🔵   🟢
```

Clicking an assessment date opens:

```text
Khảo sát giữa HK1
23/09/2026

Planned:
✓ Toán
✓ Ngữ văn
✓ Tiếng Anh

Target:
8.8

[Enter Results]
```

The calendar therefore becomes a unified family education calendar.

---

# 44. Performance data model

Recommended relationship:

```text
USER
 │
 └── CHILD
      │
      ├── TIMETABLES
      │
      ├── EXTRA SCHEDULES
      │
      ├── SCHEDULE EXCEPTIONS
      │
      ├── ASSESSMENT PLANS
      │      │
      │      └── ASSESSMENTS
      │             │
      │             └── SUBJECT RESULTS
      │
      ├── PERFORMANCE TARGETS
      │
      └── ACHIEVEMENT RECORDS
```

---

# 45. Performance UX

The user should not need to fill a complicated database form.

Assessment flow:

```text
1. Create assessment plan
        ↓
2. Set date
        ↓
3. Set subjects
        ↓
4. Set target
        ↓
5. After exam → Enter results
        ↓
6. Automatically calculate:
   - average
   - target gap
   - subject comparison
   - trend
        ↓
7. Store achievement/result history
```

Result entry should support fast table input:

```text
Subject       Target     Actual     Gap
------------------------------------------
Toán           9.0        8.5       -0.5
Ngữ văn        8.5        8.8       +0.3
English        9.0        9.2       +0.2
KHTN           8.5        8.6       +0.1
```

---

# 46. Achievement timeline

Create a visually attractive timeline.

Example:

```text
2026
│
├── 🥇 March
│   Giải Nhất Toán cấp trường
│
├── 📜 May
│   Cambridge Certificate
│
├── ⭐ June
│   Học sinh tiêu biểu
│
└── 🏆 September
    Top result in assessment
```

The timeline should adapt to the selected theme.

Cute theme:
- stickers
- stars
- soft cards

Modern theme:
- clean vertical timeline

---

# 47. Year-over-year comparison

Allow:

```text
2024–25
2025–26
2026–27
```

comparison.

Filters:

- school year
- grade
- semester
- subject
- assessment type

Example:

```text
             2024–25   2025–26   2026–27

Average        8.1       8.5       8.7
Toán           8.4       8.7       9.1
English        8.6       8.9       9.0
Ngữ văn        7.8       8.1       8.4
Achievements    2         4         6
```

Do not compare different scoring systems without normalization.

---

# 48. Performance analytics

Use charts where they improve understanding.

Recommended:

- line chart: average over time
- bar chart: subject scores
- target vs actual
- achievement count by year
- assessment performance trend

Avoid excessive dashboards.

The primary purpose is to answer:

**"How is my child progressing over time?"**

---

# 49. Ranking visualization

If official ranking data exists:

```text
Current:
5 / 41

Previous:
8 / 40

Change:
Recorded rank improved by 3 positions
```

However, avoid inferring academic ability or making subjective judgments from ranking alone.

Use neutral labels:

- Current rank
- Previous rank
- Rank scope
- Total students
- Percentile, if officially available

Never invent a ranking when the source does not provide one.

---

# 50. Achievement theme integration

The visual theme system must extend to performance.

For Cute:

```text
🏆 Achievement cards
🌟 stars
🎀 ribbons
📚 books
```

For Modern:

```text
clean cards
subtle icons
compact charts
```

For Pastel:

```text
soft timeline
gentle charts
```

For Colorful:

```text
strong achievement colors
larger visual indicators
```

The underlying components remain the same.

---

# 51. Updated main navigation

Desktop:

```text
Dashboard
Calendar
Timetable
Performance
Achievements
Extra Classes
Children
Settings
```

Possible consolidation:

```text
Performance
├── Overview
├── Assessments
├── Targets
├── Achievements
└── History
```

Recommended UX is to keep Performance as one top-level area and use sub-navigation rather than creating too many top-level menu items.

Mobile:

```text
Home
Calendar
Timetable
Performance
More
```

---

# 52. Updated development phases

## Phase 1 — Foundation

- React/Vite/TypeScript
- Supabase
- Auth
- database
- RLS
- routing
- responsive shell
- design system
- theme provider

## Phase 2 — Children

- child CRUD
- child selector
- profile
- school/class

## Phase 3 — Timetable

- timetable versions
- effective dates
- weekly editor
- teacher
- subject
- duplicate timetable

## Phase 4 — Calendar

- month calendar
- date selection
- timetable resolution
- daily schedule
- exceptions

## Phase 5 — Extra Classes

- recurring schedule
- session grouping
- date range
- optional Sunday tutoring

## Phase 6 — Performance

- assessment plans
- assessments
- subject results
- targets
- score history
- rank records
- year-over-year comparison

## Phase 7 — Achievements

- achievement records
- certificate/image upload
- achievement timeline
- achievement dashboard

## Phase 8 — Visual Polish

- Cute theme
- Modern theme
- Pastel theme
- Colorful theme
- theme preview
- illustrations
- animations
- polished infographic timetable
- performance visualizations

## Phase 9 — Print / PWA

- A4 landscape
- print CSS
- PDF
- PWA
- optional offline read access

---

# 53. Updated MVP

The first complete MVP should include:

### Family

- multiple children
- child selector

### Timetable

- timetable versions
- effective date
- school timetable
- teacher
- extra classes
- exceptions

### Calendar

- month view
- date selection
- timetable resolution
- assessment indicators

### Performance

- assessment plan
- assessment result
- subject scores
- target score
- target vs actual
- rank record
- achievement record
- performance history

### Design

- unified design system
- Cute theme
- Modern theme
- responsive mobile
- infographic timetable

---

# 54. Product architecture principle

The application is now a broader **Family Education Management Platform**, not only a timetable application.

The core domains are:

```text
FAMILY
 │
 ├── CHILDREN
 │
 ├── SCHEDULE
 │     ├── TIMETABLE
 │     ├── EXTRA CLASSES
 │     └── EXCEPTIONS
 │
 ├── CALENDAR
 │
 └── LEARNING & PERFORMANCE
       ├── ASSESSMENT PLANS
       ├── RESULTS
       ├── TARGETS
       ├── ACHIEVEMENTS
       └── HISTORY
```

The global Design System and Theme System sit across all domains:

```text
                 DESIGN SYSTEM
                       │
              ┌────────┴────────┐
              │                 │
           THEMES          COMPONENTS
              │                 │
              └────────┬────────┘
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    Schedule        Calendar       Performance
       │                                │
   Timetable                        Assessments
   Extra Classes                    Targets
   Exceptions                       Achievements
```

The long-term product goal is:

**One place where parents can see what their children need to do, what they have achieved, what they are preparing for, and how their recorded performance has changed over the years — presented through one beautiful, consistent, themeable interface.**
