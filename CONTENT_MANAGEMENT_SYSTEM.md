# Admin Content Management System Documentation

## Overview

The Abundant Global Club now has a comprehensive content management system (CMS) that allows admins to manage the About page and related content pages without requiring coding knowledge. All content is stored in Firestore and syncs in real-time to the public website.

## Admin Interfaces

### 1. About Page Manager (`/admin/about-page`)

**Purpose**: Create and manage sections that appear on the main About page

**Features**:
- Create new sections with title, subtitle, description, and content
- Choose section type: Hero, Card, Text, Values Grid
- Edit any existing section
- Delete sections
- Reorder sections with display order
- Toggle section visibility on/off
- See live preview of changes

**Workflow**:
1. Navigate to `/admin/about-page`
2. Click "Create Section"
3. Fill in section details
4. Choose section type
5. Set display order and visibility
6. Click Create
7. Changes appear on `/about` page instantly

### 2. Content Pages Manager (`/admin/content-pages`)

**Purpose**: Create separate content pages that appear as dropdown items in the About menu

**Features**:
- Create new content pages with custom URLs
- Categorize pages (About, What We Do, Why AGC, Leadership, Careers, Custom)
- Set navigation label (what appears in dropdown menu)
- Add title, subtitle, description
- Full content management with sections
- Publish/Draft workflow
- Reorder pages

**Workflow**:
1. Navigate to `/admin/content-pages`
2. Click "Create Page"
3. Fill in page details (title, slug, category, nav label)
4. Add content and sections
5. Publish when ready
6. Page appears in About dropdown menu automatically

## Public Interfaces

### 1. About Page (`/about`)

**What Users See**:
- Fully dynamic About page built from admin-managed sections
- Main about page with mission, vision, values
- All sections fully editable from admin
- Real-time updates
- Responsive design

**Default Sections** (if Firestore is empty):
- Hero section with title and subtitle
- Mission card
- Vision card
- Values card
- Core values grid

### 2. About Dropdown Menu

**Location**: Header navigation bar

**What It Shows**:
- "About" link replaced with dropdown
- All published content pages listed
- Organized by category
- Click to navigate to individual pages

**Example Menu Items**:
- About (main page)
- What We Do
- Why AGC
- Leadership Team
- Careers
- Any custom pages

### 3. Dynamic Content Pages (`/about/[slug]`)

**What Users See**:
- Full page content created in admin
- Individual URLs like `/about/what-we-do`, `/about/leadership`
- Full responsive layout
- Professional styling
- Meta tags for SEO

## Firestore Data Structure

### Collection: `aboutPageSections`

Stores individual sections for the main About page.

**Fields**:
```json
{
  "id": "section-123",
  "title": "Our Mission",
  "subtitle": "Optional subtitle",
  "content": "Mission description text...",
  "type": "card",  // Options: hero, card, text, values-grid
  "order": 1,      // Display order
  "isVisible": true,
  "createdAt": 1718641200000,
  "updatedAt": 1718641200000
}
```

### Collection: `contentPages`

Stores dynamic content pages that appear in the About dropdown.

**Fields**:
```json
{
  "id": "page-456",
  "title": "What We Do",
  "slug": "what-we-do",
  "subtitle": "Optional subtitle",
  "description": "Page description",
  "navLabel": "What We Do",
  "category": "about",  // Options: about, what-we-do, why-agc, leadership, careers, custom
  "order": 2,
  "isPublished": true,
  "createdBy": "admin-uid",
  "createdAt": 1718641200000,
  "updatedAt": 1718641200000,
  "sections": [/* array of ContentSection objects */]
}
```

## Real-Time Behavior

### When Admin Creates Content
1. Admin fills form and clicks Create
2. Data saved to Firestore instantly
3. Public page reloads section data
4. Changes visible <100ms
5. No page refresh needed

### When Admin Updates Content
1. Admin edits section and clicks Update
2. Firestore updated immediately
3. All users see new content instantly
4. Real-time sync across all devices

### When Admin Publishes Page
1. Page status changed to "published"
2. Page appears in dropdown menu instantly
3. Dynamic route becomes accessible
4. Users can navigate to page

### When Admin Deletes Content
1. Section or page deleted from Firestore
2. Removed from displays immediately
3. All users see updated content
4. No cache delays

## Content Examples

### Example: Mission Section
```
Type: Card
Title: Our Mission
Subtitle: Why we exist
Content: To cultivate a global community of high-achievers committed to abundant living, mutual growth, and collective success through meaningful connections and collaborative opportunities.
Order: 1
Visible: Yes
```

### Example: Leadership Page
```
Title: Leadership Team
Slug: leadership
NavLabel: Leadership
Category: leadership
Content: Information about leadership team...
Published: Yes
```

## Best Practices

### For Content
1. **Be Clear**: Use simple, direct language
2. **Be Specific**: Include concrete details and examples
3. **Be Organized**: Break content into logical sections
4. **Use Hierarchy**: Start with main points, add details

### For Sections
1. **Hero Section**: Use at top of pages with main title and subtitle
2. **Card Section**: For key points (3-4 per row on desktop)
3. **Text Section**: For paragraphs of content
4. **Values Grid**: For lists of core values or features

### For Pages
1. **Logical URL**: Use hyphens in slugs (e.g., "what-we-do")
2. **Clear Navigation Label**: Match what users expect to see
3. **Consistent Ordering**: Keep pages in logical order
4. **Published Status**: Ensure page is published before sharing link

## Troubleshooting

### Content Not Appearing
1. Check if section/page is marked as visible/published
2. Verify Firestore connection (check browser console)
3. Try page refresh
4. Check if order is set correctly

### Dropdown Menu Not Showing Pages
1. Ensure pages are published (isPublished: true)
2. Check navLabel is set
3. Verify category is correct
4. Check browser console for errors

### Page Not Found (404)
1. Verify page slug is correct
2. Check page is published
3. Ensure URL matches the slug
4. Check Firestore has the page

## Technical Details

### TypeScript Types
- `ContentSection`: Defines structure of about sections
- `ContentPage`: Defines structure of dynamic pages
- `ContentItem`: Sub-items within sections

### Firebase Rules (Recommended)
```
// Public can read published pages
match /contentPages/{document=**} {
  allow read: if resource.data.isPublished == true;
  allow write: if request.auth.uid != null && hasRole('admin');
}

// Admin can manage all sections
match /aboutPageSections/{document=**} {
  allow read, write: if hasRole('admin');
}
```

### API Endpoints
- `GET /api/content-pages` - List published pages
- `GET /api/content-pages/[slug]` - Get page by slug
- `POST /api/content-pages` - Create page (admin)
- `PUT /api/content-pages/[id]` - Update page (admin)
- `DELETE /api/content-pages/[id]` - Delete page (admin)

## Future Enhancements

### Potential Features
1. **Rich Text Editor**: WYSIWYG editor for better formatting
2. **Image Upload**: Direct image uploads to Firestore Storage
3. **SEO Settings**: Custom meta titles, descriptions, keywords
4. **Scheduled Publishing**: Schedule content to publish at specific times
5. **Revision History**: Track all changes and revert if needed
6. **Preview Mode**: Preview changes before publishing
7. **Multi-language**: Support for multiple languages
8. **Templates**: Pre-designed section templates
9. **Analytics**: Track page views and engagement
10. **Comments**: Admin notes and collaboration

## Support

For issues or questions:
1. Check admin console for error messages
2. Review Firestore database directly
3. Check browser developer tools console
4. Verify Firebase authentication is working
5. Contact technical team if issues persist
