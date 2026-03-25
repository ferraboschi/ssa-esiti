# SSA Esiti - Component & Style Guide

## Button Styles

### Primary Button
```html
<button class="btn btn-primary">Primary Action</button>
```
- Background: `#635BFF`
- Text: White
- Use for: Main actions (Create, Save, Send)

### Secondary Button
```html
<button class="btn btn-secondary">Secondary Action</button>
```
- Background: Light gray
- Text: Dark gray
- Border: 1px solid `#E5E7EB`
- Use for: Alternative actions (Cancel, Back)

### Ghost Button
```html
<button class="btn btn-ghost">Ghost Action</button>
```
- Background: Transparent
- Text: `#635BFF`
- Border: 1px solid `#635BFF`
- Use for: Links that look like buttons

### Error Button
```html
<button class="btn btn-error">Delete</button>
```
- Background: `#EF4444`
- Text: White
- Use for: Destructive actions

### Success Button
```html
<button class="btn btn-success">Confirm</button>
```
- Background: `#10B981`
- Text: White

### Size Variants

```html
<button class="btn btn-primary">Normal Button</button>
<button class="btn btn-primary btn-small">Small Button</button>
<button class="btn btn-primary btn-icon">📎</button>
```

---

## Form Elements

### Text Input
```html
<div class="form-group">
  <label class="form-label">Name</label>
  <input type="text" class="form-input" placeholder="Enter name">
</div>
```

### Textarea
```html
<div class="form-group">
  <label class="form-label">Message</label>
  <textarea class="form-textarea" placeholder="Enter message..."></textarea>
</div>
```

### Select Dropdown
```html
<div class="form-group">
  <label class="form-label">Category</label>
  <select class="form-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

### Checkbox
```html
<label class="checkbox">
  <input type="checkbox">
  <span class="checkbox-label">I agree to terms</span>
</label>
```

### Form Validation

```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input" required>
  <div class="form-error">Please enter a valid email</div>
  <div class="form-hint">We'll never share your email</div>
</div>
```

---

## Cards

### Basic Card
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

### Card with Structure
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <p class="card-description">Description</p>
  </div>

  <div class="card-body">
    <!-- Content -->
  </div>

  <div class="card-footer">
    <button class="btn btn-primary">Save</button>
  </div>
</div>
```

### Stat Card
```html
<div class="stat-card">
  <div class="stat-label">Total Exams</div>
  <div class="stat-value">24</div>
  <div class="stat-change positive">↑ 12% this month</div>
</div>
```

---

## Badges

### Success Badge
```html
<span class="badge badge-success">✓ Approved</span>
```

### Error Badge
```html
<span class="badge badge-error">✗ Rejected</span>
```

### Warning Badge
```html
<span class="badge badge-warning">⚠ Pending</span>
```

### Primary Badge
```html
<span class="badge badge-primary">Featured</span>
```

### Neutral Badge
```html
<span class="badge badge-neutral">Tag</span>
```

---

## Tables

### Basic Table
```html
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>john@example.com</td>
      <td><span class="badge badge-success">Active</span></td>
    </tr>
  </tbody>
</table>
```

---

## Modals

### Create Modal
```javascript
const modal = document.getElementById('auth-modal');
modal.classList.remove('hidden');
modal.innerHTML = `
  <div class="modal-overlay" onclick="closeAuthModal()"></div>
  <div class="modal-content">
    <button class="modal-close" onclick="closeAuthModal()">×</button>
    <h2>Dialog Title</h2>
    <p>Modal content here</p>
    <button class="btn btn-primary">Save</button>
  </div>
`;
```

### Close Modal
```javascript
closeAuthModal();
// or
document.getElementById('auth-modal').classList.add('hidden');
```

---

## Toasts / Notifications

### Show Toast
```javascript
// Success
app.showToast('Operation completed!', 'success');

// Error
app.showToast('Something went wrong', 'error');

// Warning
app.showToast('Please review this', 'warning');

// Info (default)
app.showToast('New update available');
```

Toast appears top-right, auto-dismisses after 3 seconds.

---

## Layout Components

### Page Header
```html
<div class="page-header">
  <div class="page-header-title">
    <h1>Page Title</h1>
    <p>Subtitle or description</p>
  </div>
  <div class="page-header-actions">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Filter Bar
```html
<div class="filter-bar">
  <input type="text" class="form-input filter-input" placeholder="Search...">
  <select class="form-select filter-select">
    <option>All</option>
  </select>
  <span class="filter-badge active">Active Filter ×</span>
</div>
```

### Stats Grid
```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">Metric 1</div>
    <div class="stat-value">100</div>
  </div>
  <!-- More stat cards -->
</div>
```

---

## Exam Cards

### Exam List Item
```html
<div class="exam-card" onclick="app.navigateTo('/esami/id')">
  <div class="exam-info">
    <div class="exam-name">Nihonshu Test 2024</div>
    <div class="exam-meta">
      <div class="exam-meta-item">📚 20 questions</div>
      <div class="exam-meta-item">👥 15 students</div>
      <div class="exam-meta-item">📊 12 results</div>
    </div>
    <div style="font-size: 0.875rem; color: #9CA3AF;">
      test_esame • nihonshu
    </div>
  </div>
  <div class="exam-actions">
    <button class="btn btn-small btn-secondary">Details</button>
  </div>
</div>
```

---

## Result Badges

### Positivo (Passed)
```html
<span class="badge result-positivo">✓ Positivo</span>
```
- Background: Light green
- Color: `#10B981`

### Negativo (Failed)
```html
<span class="badge result-negativo">✗ Negativo</span>
```
- Background: Light red
- Color: `#EF4444`

### Retake (Borderline)
```html
<span class="badge result-retake">⊕ Retake</span>
```
- Background: Light amber
- Color: `#F59E0B`

---

## Category Breakdown

### Category Card
```html
<div class="category-card">
  <div class="category-name">STORIA</div>
  <div class="category-progress">
    <div class="category-progress-bar" style="width: 75%"></div>
  </div>
  <div class="category-stat">
    <span class="category-stat-label">Result</span>
    <span class="category-stat-value">15/20</span>
  </div>
  <div class="category-stat">
    <span class="category-stat-label">Percentage</span>
    <span class="category-stat-value">75%</span>
  </div>
</div>
```

---

## Question Editor

### Question Card
```html
<div class="question-editor">
  <div class="question-header">
    <div class="question-number">Question 1</div>
    <select class="form-select question-type-select">
      <option>Multiple Choice</option>
      <option>Open</option>
      <option>True/False</option>
    </select>
  </div>

  <div class="question-languages">
    <div class="lang-tab active">🇮🇹 IT</div>
    <div class="lang-tab">🇬🇧 EN</div>
    <div class="lang-tab">🇯🇵 JP</div>
  </div>

  <div class="form-group">
    <textarea class="form-textarea" placeholder="Enter question text..."></textarea>
  </div>

  <div class="question-actions">
    <button class="btn btn-secondary">Add Option</button>
    <button class="btn btn-error">Delete</button>
  </div>
</div>
```

---

## Empty States

### Empty State Template
```html
<div class="empty-state">
  <div class="empty-icon">📝</div>
  <p class="empty-title">No Exams</p>
  <p class="empty-text">Create your first exam to get started</p>
  <button class="btn btn-primary" onclick="esamiPage.showCreateModal()">
    Create Exam
  </button>
</div>
```

Available icons (emoji):
- 📝 (documents)
- 👥 (people)
- 📊 (results)
- ❓ (questions)
- 📚 (knowledge base)
- 🔑 (keys)
- ⚙️ (settings)

---

## Responsive Behavior

### Mobile Stack
On screens < 768px:
- Sidebar collapses/hides
- Grid becomes single column
- Buttons stack vertically
- Tables become scrollable

### Page Container Padding
- Desktop: `3rem` (48px)
- Mobile: `1.5rem` (24px)

### Grid Breakpoints
```css
/* Desktop */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

---

## Color Reference

### Outcome Colors
```
Positivo:  #10B981 (Success Green)
Negativo:  #EF4444 (Error Red)
Retake:    #F59E0B (Warning Amber)
```

### Status Colors
```
Active:    #635BFF (Primary Purple)
Inactive:  #9CA3AF (Neutral Gray)
Pending:   #F59E0B (Warning Amber)
```

### Text Colors
```
Heading:   #111827 (Neutral 900)
Body:      #4B5563 (Neutral 600)
Muted:     #9CA3AF (Neutral 400)
Disabled:  #D1D5DB (Neutral 300)
```

### Background Colors
```
Primary BG:    #FFFFFF (White)
Secondary BG:  #F3F4F6 (Neutral 100)
Tertiary BG:   #FAFAFA (Neutral 50)
```

---

## Typography Sizes

```
h1: 2.0rem (32px)
h2: 1.5rem (24px)
h3: 1.25rem (20px)
h4: 1.125rem (18px)
p:  1.0rem  (16px)
small: 0.875rem (14px)
```

---

## Shadow Levels

```
sm: 0 1px 2px 0 rgba(0,0,0,0.05)
md: 0 4px 6px -1px rgba(0,0,0,0.1)
lg: 0 10px 15px -3px rgba(0,0,0,0.1)
xl: 0 20px 25px -5px rgba(0,0,0,0.1)
```

---

## Border Radius

```
sm: 0.375rem (6px)   - Small elements
md: 0.5rem (8px)     - Inputs, buttons
lg: 0.75rem (12px)   - Cards
xl: 1rem (16px)      - Large sections
```

---

## Spacing Scale

```
xs: 0.25rem (4px)
sm: 0.5rem  (8px)
md: 1rem    (16px)
lg: 1.5rem  (24px)
xl: 2rem    (32px)
2xl: 3rem   (48px)
```

---

## Animation

### Toast Slide In
```css
animation: slideIn 0.3s ease-out;
```

### Button Hover
```css
transition: all 0.2s;
```

### Badge Color Change
```css
transition: all 0.2s;
```

---

## Accessibility

- **Focus states**: Blue outline on keyboard focus
- **Color contrast**: WCAG AA compliant
- **Labels**: Always associated with inputs
- **Semantic HTML**: Use `<button>`, `<label>`, etc.

---

**Last Updated**: March 2026
**Version**: 1.0
