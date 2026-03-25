# SSA Esiti Frontend

A beautiful, Stripe-inspired Single Page Application (SPA) for managing Sake Sommelier (SSA) certification exams. Built with vanilla JavaScript, no frameworks.

## Overview

The SSA Esiti platform manages exam scenarios for sake and shochu sommelier certifications. The frontend provides interfaces for professors to create exams, manage students, analyze results, and communicate feedback, while students can view their exam results.

## Architecture

```
frontend/
├── index.html              # SPA shell with auth modal & toast container
├── css/
│   ├── main.css           # Design tokens, layout, core components
│   └── components.css     # Page-specific component styles
├── js/
│   ├── app.js             # Router, auth, API client, layout engine
│   └── pages/
│       ├── login.js       # Authentication
│       ├── dashboard.js   # Professor dashboard (stats, recent exams)
│       ├── esami.js       # Exam list & CRUD
│       ├── esame-detail.js    # Single exam view
│       ├── domande.js     # Questions editor
│       ├── studenti.js    # Student management
│       ├── esiti.js       # Results overview
│       ├── esito-detail.js    # Single result analysis
│       ├── email.js       # Bulk email interface
│       ├── knowledge-base.js  # KB articles CRUD
│       ├── api-keys.js    # API key management
│       └── impostazioni.js    # Settings & preferences
└── assets/                # (empty for now)
```

## Design System

### Color Palette
- **Primary**: `#635BFF` (Indigo/Purple)
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)
- **Neutral**: Grayscale from `#FAFAFA` to `#111827`

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: 600-700 weight, tight line-height
- **Body**: 400-500 weight, 1.5 line-height

### Spacing
- `--space-xs` through `--space-2xl` (0.25rem to 3rem)
- 8px base unit

### Components
- **Cards**: White background, subtle border, hover shadow
- **Buttons**: Primary (indigo), Secondary (neutral), Ghost (outline), Error (red)
- **Tables**: Clean, striped rows, hover effect
- **Badges**: Color-coded (success, error, warning, primary, neutral)
- **Modals**: Centered overlay with backdrop
- **Toasts**: Top-right stack with auto-dismiss

## Key Features

### Authentication
- Email-based login for students (implicit password = email)
- Email + password for professors
- JWT token stored in `sessionStorage` (not `localStorage`)
- Automatic redirect to login on auth failure

### Professor Dashboard
- Statistics cards: total exams, students, success rate, registered results
- Recent exams list with quick stats
- Navigation sidebar with role-based menu

### Exam Management
- Create exams (name, spirit type: nihonshu/shochu, type: feedback/test_esame/esame)
- List exams with filters
- View exam details: questions, student results
- Calculate and display success rates

### Questions Editor
- Multi-language support (Italian, English, Japanese)
- Question types: multiple choice, open, true/false
- Categories: STORIA, PRODUZIONE, INGREDIENTI, COCKTAIL, ETICHETTE, FINITURE E ANALISI, INDUSTRIA E ICONE DEL SAKE, MISUNDERSTANDING, SAKE & FOOD PAIRING, SERVIZIO, TASTING
- Full CRUD operations

### Student Management
- List all students with exam/result counts
- Search by name or email
- Add/remove students

### Results Analysis
- Overview of all results with filterable list
- Per-student view of their results (for students)
- Detailed result analysis:
  - Score breakdown
  - Category-wise performance
  - Question-by-question review
  - Feedback notes (editable by professors)

### Email Communication
- Filter recipients by outcome (positivo, negativo, retake)
- Compose and preview emails
- Bulk send with tracking

### Knowledge Base
- CRUD for KB articles
- Categorize articles
- Full-text search

### API Key Management
- Generate API keys for external integrations
- Copy/revoke keys
- Simple usage documentation

### Settings
- Profile management
- Notification preferences
- Language & timezone
- Password change
- Session management
- Data export (JSON)

## Routing

Speaking URLs with hash-based routing:

```javascript
/login              // Login page
/dashboard          // Professor dashboard
/esami              // Exam list
/esami/:id          // Exam detail
/domande            // Questions editor
/studenti           // Student list
/esiti              // Results list
/esiti/:id          // Result detail
/esiti/miei         // Student's own results
/email              // Email interface
/knowledge-base     // KB management
/api-keys           // API keys
/impostazioni       // Settings
```

## API Integration

All API calls use `/api` base URL (same origin) with Bearer token auth:

```javascript
const res = await app.api('/exams');
// GET /api/exams with Authorization: Bearer {token}

const res = await app.api('/exams', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Expected Endpoints

**Auth**
- `POST /auth/login` → `{ token, user }`
- `GET /auth/me` → `{ user }`
- `POST /auth/change-password`

**Exams**
- `GET /exams` → `{ data: [...] }`
- `GET /exams/:id` → exam object
- `GET /exams/:id/results` → `{ data: [...] }`
- `POST /exams` → create
- `DELETE /exams/:id` → delete

**Questions**
- `GET /questions` → `{ data: [...] }`
- `POST /questions` → create
- `DELETE /questions/:id` → delete

**Students**
- `GET /students` → `{ data: [...] }`
- `GET /students?filter=positivo|negativo|retake|all`
- `POST /students` → add
- `DELETE /students/:id` → remove

**Results**
- `GET /results` → `{ data: [...] }`
- `GET /results/:id` → detailed result
- `GET /results/my` → student's own results
- `PATCH /results/:id` → update feedback

**Dashboard**
- `GET /dashboard/stats` → `{ total_exams, total_students, success_rate, total_results }`

**Email**
- `POST /email/send` → `{ recipients: [], subject, body }`

**Knowledge Base**
- `GET /knowledge-base` → `{ data: [...] }`
- `POST /knowledge-base` → create
- `DELETE /knowledge-base/:id` → delete

**API Keys**
- `GET /api-keys` → `{ data: [...] }`
- `POST /api-keys` → create
- `DELETE /api-keys/:id` → revoke

**Settings**
- `GET /settings` → settings object
- `PATCH /settings` → update
- `POST /auth/change-password` → change password
- `GET /data/export` → export JSON

## Code Style

### Page Modules
Each page exports a `render()` function:

```javascript
const pageName = {
  async render() {
    const html = `<!-- template -->`;
    app.renderLayout(html);
  }
};
```

### Template Literals
Use template literals for HTML generation:

```javascript
const html = `<div class="card">
  <h2>${data.title}</h2>
  <p>${data.description}</p>
</div>`;
```

### Event Handlers
Inline event handlers reference global functions:

```html
<button onclick="domandeePage.filterQuestions(this.value)">Filter</button>
```

### State Management
Global app state in `app` object:
- `app.currentUser` - authenticated user
- `app.token` - JWT token
- `app.currentPage` - active page

Page-level state in each page module.

## Styling Approach

1. **CSS Variables** for consistency
2. **BEM-lite naming**: `.card`, `.card-header`, `.card-body`
3. **No breakpoints below 768px** (mobile support via media queries)
4. **Responsive grid**: `grid-template-columns: repeat(auto-fit, minmax(...))`
5. **Utility classes**: `.hidden`, `.text-muted`, `.gap-md`

## Development

### Running Locally

```bash
# Serve the frontend directory on a local server
python -m http.server 8000
# Or: npx http-server
# Or: any static file server

# Open http://localhost:8000
```

### Making Changes

1. Edit `.js` or `.css` files
2. Refresh browser (no build step needed)
3. Check browser console for errors

### Adding a New Page

1. Create `/js/pages/newpage.js`
2. Define module with async `render()` function
3. Add route to `app.setupRouter()`
4. Add nav item to `getNavItems()`
5. Link `<script>` in `index.html`

Example:

```javascript
// js/pages/newpage.js
const newPage = {
  async render() {
    const html = `<div>Content</div>`;
    app.renderLayout(html);
  }
};
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript (fetch, template literals, arrow functions)
- CSS Grid & Flexbox

## Performance

- **No bundling** - direct script loads
- **No framework overhead** - vanilla JS
- **Minimal re-renders** - replace innerHTML when needed
- **Toast notifications** - auto-dismiss after 3 seconds

## Security Notes

1. **JWT in sessionStorage** - cleared on tab close
2. **CORS headers** - backend must allow same-origin requests
3. **Sanitization** - user data shown as text (not HTML)
4. **API validation** - backend validates all inputs
5. **No sensitive data in URLs** - search params for filters only

## Next Steps

- Add image upload for student avatars
- Implement bulk result import (CSV)
- Add date range filters for results
- Real-time exam creation with WebSockets
- Export results to PDF/Excel
- Advanced result analytics & charts

---

**Built with ♥️ for Sake Sommelier Excellence**
