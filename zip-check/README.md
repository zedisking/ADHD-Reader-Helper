# ADHD Reading Helper - Microsoft Edge Extension

Converts any webpage, URL, or uploaded file to **Bionic Reading** format for faster, more focused reading. Bionic Reading bolds the first portion of each word to create fixation points that help your eyes scan text more efficiently.

**Author:** Damien Cresswell

---

## Features

- **Universal conversion**: Works on any website, `file://` URLs, and uploaded files opened in a new tab
- **Document upload**: Upload TXT, PDF, DOCX, or ODT files and view them with bionic reading in the browser
  - Preserves document formatting (headings, lists, tables, paragraphs)
  - Light background for optimal bionic reading effectiveness
- **Strength scale** (1–5): Adjust how much of each word is bolded (1 = subtle, 5 = strong)
- **Tag exclusions**: By default excludes `<html>`, `<header>`, `<footer>`, `<button>`, `<input>`, `<textarea>`, `<select>`
- **Per-tag toggles**: Enable or disable Bionic Reading for any excluded tag individually
- **Page tag detection**: Scan the current page to see all HTML tags and toggle inclusion/exclusion per tag
- **Auto-refresh**: Settings changes automatically reload the page with new options applied
- **Auto-apply on install**: Extension applies immediately when first installed

---

## Installation

1. Run `npm install` in the extension folder (installs JSZip, PDF.js, and Mammoth for document parsing)
2. Open Microsoft Edge and go to `edge://extensions/`
3. Enable **Developer mode** (toggle in the bottom-left)
4. Click **Load unpacked**
5. Select the `ADHD Reading Helper` folder

---

## Usage

### Popup
- Click the extension icon to toggle the reading helper on/off
- Adjust the strength slider (1–5)
- Click **Upload document** to open the document reader in a new tab
- Click **Open Settings** for full configuration

### Document Reader
- Click **Choose file** or drag and drop a file onto the upload zone
- Supports: TXT, PDF, DOCX, ODT
- Use the strength slider to adjust bionic intensity
- Documents display on a light background for better readability

### Settings
- Right-click the extension icon → **Options**, or click **Open Settings** in the popup
- **Default Excluded Tags**: Toggle which standard elements (header, footer, button, etc.) are excluded from bionic reading
- **Scan current page for tags**: Detect all HTML tags on a page and control inclusion/exclusion per tag
- All changes auto-refresh the target page

---

## File Structure

```
ADHD Reading Helper/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker
├── bionic-core.js     # Bionic conversion algorithm
├── content.js         # Content script (runs on pages)
├── content.css        # Minimal styles for bionic text
├── popup.html/js      # Toolbar popup
├── settings.html/js   # Options/settings page
├── reader.html/js     # Document upload & reader (TXT, PDF, DOCX, ODT)
├── icons/             # Extension icons (16, 32, 48, 128)
├── lib/               # JSZip, PDF.js, Mammoth (created by npm install)
├── scripts/           # Build script for store package
├── PRIVACY_POLICY.md  # Privacy policy for store submission
├── STORE_SUBMISSION.md # Guide for publishing to Edge Add-ons
└── package.json       # Dependencies (jszip, pdfjs-dist, mammoth)
```

---

## Publishing to Microsoft Edge Add-ons

To publish this extension to the [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons) store:

1. Run `npm install` then `npm run package` to create the submission zip
2. See **STORE_SUBMISSION.md** for the full submission guide
3. Host **PRIVACY_POLICY.md** and provide the URL in Partner Center (if required)

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save strength, enabled state, and tag exclusions |
| `activeTab`, `tabs` | Access current tab for settings scan and reload |
| `scripting` | Inject tag-scan script |
| `host_permissions` (`<all_urls>`, `file:///*`) | Run on any page or local file |
