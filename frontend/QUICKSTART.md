# SSA Esiti Frontend - Quick Start Guide

## 5-Minute Setup

### 1. Start a Local Server

```bash
cd /sessions/zen-epic-fermat/ssa-esiti/frontend

# Option A: Python
python -m http.server 8000

# Option B: Node.js
npx http-server

# Option C: Ruby
ruby -run -ehttpd . -p8000
```

### 2. Open in Browser

```
http://localhost:8000
```

### 3. Login

**Student:**
- Email: `student@example.com`
- Password: (leave blank, email used as password)
- Check "Are you a professor?" - NO

**Professor:**
- Email: `prof@example.com`
- Password: `securepass123`
- Check "Are you a professor?" - YES

## File Structure Quick Reference

```
frontend/
├── index.html          ← Main entry point (start here to understand flow)
├── css/
│   ├── main.css       ← Design tokens, layout (modify colors here)
│   └── components.css ← Specific component styles
├── js/
│   ├── app.js         ← Router, auth, API client (core logic)
│   └── pages/         ← Each page is a module with render() function
│       ├── login.js
│       ├── dashboard.js
│       ├── esami.js
│       └── ...
└── README.md          ← Full documentation
```

## Common Tasks

### Add a New Page

1. Create `/js/pages/mypage.js`:
```javascript
const myPage = {
  async render() {
    const data = await app.api('/my-endpoint');
    const html = `<div>...</div>`;
    app.renderLayout(html);
  }
};
```

2. Add route to `app.setupRouter()` in `app.js`:
```javascript
'/mypage': () => this.requireAuth(() => myPage.render()),
```

3. Add nav item to `getNavItems()` in `app.js`:
```javascript
<div class="nav-item" data-route="/mypage" onclick="app.navigateTo('/mypage')">
  <span class="nav-icon">📄</span>
  <span>My Page</span>
</div>
```

### Change Colors

Edit `/css/main.css`:
```css
:root {
  --color-primary: #635BFF;        /* Purple accent */
  --color-success: #10B981;        /* Green */
  --color-error: #EF4444;          /* Red */
  /* ... etc */
}
```

### Modify API Endpoints

Edit `app.api()` calls in page modules. The API base is `/api`:

```javascript
// These are equivalent
await app.api('/exams')           // GET /api/exams
await app.api('/exams/123')       // GET /api/exams/123
await app.api('/exams', {
  method: 'POST',
  body: JSON.stringify(data)
})                                 // POST /api/exams
```

### Add a Toast Notification

```javascript
app.showToast('Success message!', 'success');
app.showToast('Error occurred', 'error');
app.showToast('Warning', 'warning');
```

### Open a Modal

```javascript
const modal = document.getElementById('auth-modal');
modal.classList.remove('hidden');
modal.innerHTML = `<div class="modal-content">...</div>`;

// Close with:
closeAuthModal();
```

## Browser Console

Open DevTools (F12) and check Console tab for:
- API errors
- Missing elements
- JavaScript exceptions

Common issues:
- 404 on API calls → backend not running
- "Cannot read property of null" → element not found
- CORS errors → backend CORS config

## Testing with Mock API

To test without a backend, modify `app.api()` in `app.js`:

```javascript
async api(path, options = {}) {
  // MOCK: Return fake data
  if (path === '/exams') {
    return {
      data: [
        { id: '1', name: 'Nihonshu Test', questions_count: 20 },
        { id: '2', name: 'Shochu Test', questions_count: 15 }
      ]
    };
  }

  // Real API call
  const res = await fetch(`/api${path}`, { ... });
  return res.json();
}
```

## File Size Overview

```
main.css       ~15 KB  (design system + layout)
components.css ~12 KB  (page-specific styles)
app.js         ~8 KB   (router, auth, API client)
Each page      ~3-4 KB (usually)

Total gzipped: ~20-30 KB
```

## Performance Tips

1. **Lazy load data**: Only fetch when page renders
2. **Cache API responses**: Store in module variables
3. **Minimize DOM updates**: Build HTML string first, then replace
4. **Use CSS classes**: Don't inline styles

## Debugging Tips

### Log API Calls
```javascript
async api(path, options = {}) {
  console.log(`API: ${options.method || 'GET'} ${path}`);
  const res = await fetch(...);
  console.log('Response:', res);
  return res.json();
}
```

### Log Page Renders
```javascript
const myPage = {
  async render() {
    console.log('Rendering MyPage');
    // ...
  }
};
```

### Inspect State
```javascript
// In console tab:
app.currentUser
app.token
app.currentPage
// Page-specific state
domandeePage.questions
esitiPage.results
```

## Deploy Checklist

- [ ] Update API base URL in app.js if needed
- [ ] Test all routes work
- [ ] Check color scheme matches brand
- [ ] Verify responsive design (resize browser)
- [ ] Test on mobile (Chrome DevTools)
- [ ] Check for console errors (F12)
- [ ] Verify auth flow works
- [ ] Test API integration with backend
- [ ] Minify CSS/JS (optional)
- [ ] Add security headers (backend)

## Common Questions

**Q: How do I change the sidebar color?**
A: Edit `--color-primary` in `/css/main.css`

**Q: Can I use frameworks like React?**
A: Not recommended. Vanilla JS keeps it lightweight. Add as needed.

**Q: How do I handle offline mode?**
A: Add localStorage caching in `app.api()` with fallback logic

**Q: Is this SEO optimized?**
A: Not really—it's a SPA. Use a backend rendering approach if needed.

**Q: How do I add real-time updates?**
A: Integrate WebSockets in page modules with event listeners

## Support

- **Backend issues**: Check backend logs
- **Frontend issues**: Check browser console (F12)
- **API mismatch**: Verify endpoint URLs match backend
- **Styling issues**: Check CSS variables and media queries

---

**Happy coding! 🍶**
