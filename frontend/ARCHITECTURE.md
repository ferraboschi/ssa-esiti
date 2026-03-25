# SSA Esiti Frontend - Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────┐
│           Browser (Single Page App)              │
├─────────────────────────────────────────────────┤
│                   index.html                    │
│  ├── Auth Modal (login/dialogs)                 │
│  ├── Toast Container (notifications)            │
│  └── App Container (main content)               │
├─────────────────────────────────────────────────┤
│             JavaScript (app.js + pages)         │
│  ├── Router (hash-based navigation)             │
│  ├── Auth Manager (JWT token)                   │
│  ├── API Client (fetch wrapper)                 │
│  └── Layout Engine (renderLayout)               │
├─────────────────────────────────────────────────┤
│              CSS (Design System)                │
│  ├── main.css (variables, layout, core)        │
│  └── components.css (page-specific)             │
├─────────────────────────────────────────────────┤
│              Page Modules (/pages)              │
│  ├── login.js (auth)                            │
│  ├── dashboard.js (stats & exams)               │
│  ├── esami.js (exam CRUD)                       │
│  ├── esame-detail.js (single exam)              │
│  ├── domande.js (question editor)               │
│  ├── studenti.js (student mgmt)                 │
│  ├── esiti.js (result list)                     │
│  ├── esito-detail.js (result analysis)          │
│  ├── email.js (bulk messaging)                  │
│  ├── knowledge-base.js (KB CRUD)                │
│  ├── api-keys.js (API mgmt)                     │
│  └── impostazioni.js (settings)                 │
└─────────────────────────────────────────────────┘
           ⬇ HTTP ⬇
┌─────────────────────────────────────────────────┐
│         REST API Backend (/api)                 │
│  ├── /auth (login, auth/me)                     │
│  ├── /exams (CRUD)                              │
│  ├── /questions (CRUD)                          │
│  ├── /results (read, update feedback)           │
│  ├── /students (CRUD)                           │
│  ├── /email (bulk send)                         │
│  ├── /knowledge-base (CRUD)                     │
│  ├── /api-keys (CRUD)                           │
│  ├── /settings (user preferences)               │
│  └── /dashboard/stats (aggregated data)         │
└─────────────────────────────────────────────────┘
           ⬇ ⬇ ⬇
┌──────────┬──────────┬──────────┬──────────────┐
│ Database │ Auth     │ File     │ Email        │
│ (Exams,  │ Service  │ Storage  │ Service      │
│ Results) │          │          │              │
└──────────┴──────────┴──────────┴──────────────┘
```

## Data Flow

### Authentication Flow

```
1. User fills login form
   ↓
2. loginPage.handleSubmit() sends POST /auth/login
   ↓
3. Backend validates credentials, returns { token, user }
   ↓
4. app.js stores token in sessionStorage
   ↓
5. app.js sets app.currentUser
   ↓
6. Router redirects to /dashboard
   ↓
7. app.renderLayout() includes user in sidebar
```

### Page Load Flow

```
1. URL hash changes (e.g., /#/esami)
   ↓
2. hashchange event triggers app.route()
   ↓
3. Router matches route to handler
   ↓
4. Page module's render() function executes
   ↓
5. render() fetches data via app.api()
   ↓
6. render() builds HTML string
   ↓
7. render() calls app.renderLayout(html)
   ↓
8. app.renderLayout() inserts sidebar + content
   ↓
9. Browser renders new DOM
```

### API Call Flow

```
Page Module
   ↓
const res = await app.api('/exams')
   ↓
app.api() adds Authorization header
   ↓
app.api() calls fetch('/api/exams')
   ↓
Browser sends HTTP request with JWT
   ↓
Backend validates JWT
   ↓
Backend sends JSON response
   ↓
app.api() returns parsed JSON
   ↓
Page module processes data
   ↓
Page renders HTML with data
```

## State Management

### Global State (app.js)
```javascript
app = {
  currentUser: { name, email, role },    // null before login
  token: "eyJhbGc...",                   // JWT from /auth/login
  currentPage: "/esami",                 // tracked by router
}
```

### Page State (each page module)
```javascript
esamiPage = {
  exams: [],                              // data fetched from /exams
}

esitiPage = {
  results: [],                            // data fetched from /results
  isStudentView: false,                   // toggle between views
}
```

### Session State (sessionStorage)
```javascript
sessionStorage.setItem('token', token)    // persists across refreshes
sessionStorage.removeItem('token')        // on logout
```

### DOM State (HTML attributes)
```javascript
// Active nav item
nav-item.classList.add('active')

// Modal visibility
modal.classList.remove('hidden')

// Filter results (in memory, not persisted)
filteredResults = results.filter(r => ...)
```

## Routing Architecture

### Hash-Based Single Page Router

```javascript
// URL format: /#/page or /#/page/:id
window.location.hash = '#/exami/123'

// Route matching
const routes = {
  '/login': () => loginPage.render(),
  '/esami': () => esamiPage.render(),
  '/esami/:id': (id) => esameDetailPage.render(id),
}

// Dynamic matching with regex
const match = fullPath.match(/^\/esami\/(.+)$/);
if (match) {
  const id = match[1];
  esameDetailPage.render(id);
}
```

### Navigation

```javascript
// Programmatic navigation
app.navigateTo('/esami/123')
  ↓
window.location.hash = '/esami/123'
  ↓
hashchange event fires
  ↓
router matches route
  ↓
page module renders

// Direct link navigation
<a href="#/esami/123">View Exam</a>
  ↓
User clicks link
  ↓
Browser navigates to new hash
  ↓
router updates page
```

## Component Hierarchy

### Layout
```
App
├── Sidebar
│   ├── Logo
│   ├── Nav Menu
│   │   ├── Nav Sections
│   │   └── Nav Items
│   └── User Info + Logout
├── Main Content
│   ├── Top Bar (title)
│   └── Page Container
│       └── Page Content
└── Modals & Toasts
    ├── Auth Modal
    ├── Toast Container
    └── Toast Items
```

### Page Structure
```
Page
├── Page Header
│   ├── Title & Description
│   └── Action Buttons
├── Filter Bar (optional)
│   ├── Search Input
│   ├── Filter Select
│   └── Active Filters
├── Page Content
│   ├── Cards / Tables / Lists
│   ├── Empty State (if no data)
│   └── Pagination (if many items)
└── Modals (triggered from buttons)
    ├── Create Form
    ├── Edit Form
    └── Confirmation Dialog
```

## API Contract

### Request Format
```javascript
// All requests include Authorization header
Authorization: Bearer {token}
Content-Type: application/json

// GET request
GET /api/exams

// POST request with body
POST /api/exams
{
  "name": "Nihonshu Test",
  "spirit_type": "nihonshu",
  "exam_type": "test_esame"
}

// PATCH request to update
PATCH /api/results/123
{
  "feedback": "Good work!"
}
```

### Response Format
```javascript
// List endpoint returns paginated data
{
  "data": [
    { id: "1", name: "..." },
    { id: "2", name: "..." }
  ],
  "total": 42,
  "page": 1
}

// Single resource returns object
{
  "id": "123",
  "name": "Nihonshu Test",
  "questions_count": 20
}

// Auth endpoint returns token + user
{
  "token": "eyJhbGc...",
  "user": {
    "id": "u1",
    "email": "prof@example.com",
    "role": "professor"
  }
}

// Error response (from backend)
{
  "error": "Unauthorized",
  "status": 401
}
```

### Error Handling
```javascript
try {
  const res = await app.api('/exams');
  // process res
} catch (err) {
  // err.message = "API error: 401"
  // or network error
  app.showToast('Error loading exams', 'error');
}

// 401 Unauthorized → auto logout
// Other errors → show toast + log
```

## CSS Architecture

### Design System (main.css)
```css
:root {
  /* Colors */
  --color-primary: #635BFF;
  --color-success: #10B981;
  --color-error: #EF4444;
  
  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
}
```

### Component Styles (components.css)
```css
/* Utility component classes */
.page-header { ... }
.stat-card { ... }
.exam-card { ... }
.filter-bar { ... }
.question-editor { ... }
.result-badge { ... }
.category-card { ... }
```

### Responsive Design
```css
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    transform: translateX(-100%);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .page-container {
    padding: var(--space-lg);
  }
}
```

## Performance Characteristics

### Bundle Size
- main.css: ~15 KB
- components.css: ~12 KB
- app.js: ~8 KB
- Each page: ~3-4 KB
- **Total**: ~40-50 KB (uncompressed)
- **Gzipped**: ~20-30 KB

### Load Time
- HTML parse: <50ms
- CSS parse: <50ms
- JS parse + execute: <200ms
- First page render: <500ms
- API data load: 1-2s (depends on backend)

### Runtime Performance
- Page navigation: <100ms (no data fetch)
- Page with data load: 1-2s (API latency)
- Filter/search: instant (client-side)
- Modal open/close: <50ms

### Memory Usage
- App state: <10 KB
- Page state: <50 KB
- DOM size: <200 KB (typical)
- Total heap: <5 MB

## Security Considerations

### Authentication
- JWT token in sessionStorage (cleared on tab close)
- Token sent in Authorization header on every request
- No token in localStorage (prevents XSS token theft)
- No sensitive data in URL parameters

### Authorization
- Backend validates user role on every endpoint
- Frontend checks app.currentUser.role for UI decisions
- Frontend never trusts user data from API
- All user input sanitized as text (not HTML)

### API Safety
- All requests use HTTPS (in production)
- CORS headers validated by backend
- API keys stored securely (not in frontend)
- No API keys exposed in console logs

## Extensibility

### Adding New Features

1. **New Page**:
   - Create `/js/pages/feature.js`
   - Add route to `app.setupRouter()`
   - Add nav item to `getNavItems()`
   - Link script in index.html

2. **New API Endpoint**:
   - Backend adds route
   - Frontend calls `app.api('/endpoint')`
   - Page module processes response

3. **New Component**:
   - Add HTML template in page module
   - Add CSS class to `components.css`
   - Use `class` attribute in HTML

4. **New Color/Token**:
   - Add CSS variable to `:root` in `main.css`
   - Use `var(--color-name)` in stylesheets

## Testing Strategy

### Manual Testing
- Test all routes by clicking nav items
- Test API calls with network tab open
- Test forms with invalid data
- Test responsive design (resize browser)
- Test on mobile (Chrome DevTools)

### Integration Testing
- Login flow works
- Protected routes redirect to login
- API errors show toast
- Modal dialogs open/close

### Accessibility Testing
- Tab through all elements
- Check color contrast (DevTools)
- Verify labels on inputs
- Test with screen reader

## Deployment Checklist

- [ ] Update API base URL in app.js
- [ ] Test all routes work
- [ ] Verify responsive on mobile
- [ ] Check console for errors
- [ ] Test auth flow
- [ ] Verify HTTPS in production
- [ ] Set CORS headers on backend
- [ ] Test on target browsers
- [ ] Cache-bust CSS/JS files
- [ ] Add security headers (CSP, etc.)

---

**Last Updated**: March 2026
**Version**: 1.0
