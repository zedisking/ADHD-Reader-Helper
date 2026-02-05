# Microsoft Edge Add-ons Store – Submission Guide

This guide helps you publish ADHD Reading Helper to the [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons) store.

---

## 1. Create the Extension Package

Create a `.zip` file containing only the extension files (no `node_modules`):

```powershell
# From the extension folder, run:
npm run package
```

Or manually:
1. Run `npm install` (to populate the `lib/` folder)
2. Create a zip of: `manifest.json`, `background.js`, `bionic-core.js`, `content.js`, `content.css`, `popup.html`, `popup.js`, `settings.html`, `settings.js`, `reader.html`, `reader.js`, `icons/`, `lib/`

**Exclude:** `node_modules/`, `.git/`, `*.md` (except if you want README in the zip), `package.json`, `package-lock.json`

---

## 2. Partner Center Account

1. Go to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login)
2. Sign in with a Microsoft account (MSA) or GitHub
3. Enroll in the **Microsoft Edge program** (no fee)
4. Complete registration (individual or company account)

---

## 3. Submit the Extension

1. In Partner Center, click **Create new extension**
2. **Packages**: Upload your `.zip` file
3. **Availability**: Choose Public, select markets
4. **Properties**:
   - **Category**: Productivity (or similar)
   - **Privacy policy**: Select "No" if the extension does not collect personal data, or "Yes" and provide a Privacy Policy URL
   - **Privacy Policy URL**: Host `PRIVACY_POLICY.md` (e.g. GitHub Pages, your website) and use that URL
5. **Store listings** (for each language, e.g. en-US):
   - **Extension name**: ADHD Reading Helper (from manifest)
   - **Description**: Min 250 characters. Example below.
   - **Extension logo**: 128×128 px minimum, 300×300 px recommended (1:1 aspect ratio)
   - **Small promotional tile** (optional): 440×280 px
   - **Large promotional tile** (optional): 1400×560 px
   - **Screenshots** (optional): 640×480 or 1280×800 px, max 6
6. **Submit**: Add notes for certification testers, then click **Publish**

---

## 4. Store Description (250+ characters)

Use this or adapt it for the store listing:

```
ADHD Reading Helper converts any webpage, URL, or uploaded file to Bionic Reading format for faster, more focused reading. Bionic Reading bolds the first portion of each word to create fixation points that help your eyes scan text more efficiently—ideal for readers with ADHD, dyslexia, or anyone who wants to read faster with less effort.

Features:
• Works on any website, file:// URLs, and uploaded documents
• Upload TXT, PDF, DOCX, or ODT files—formatting is preserved
• Adjustable strength (1–5) to control how much of each word is bolded
• Exclude specific HTML elements (header, footer, buttons, etc.)
• Scan any page to see all tags and toggle inclusion per element
• Light background for documents for optimal readability
• All processing happens locally—no data is sent to external servers

Developed by Damien Cresswell.
```

---

## 5. Store Assets Checklist

| Asset | Size | Required |
|-------|------|----------|
| Extension logo | 128×128 min, 300×300 recommended | Yes |
| Small promotional tile | 440×280 px | No |
| Large promotional tile | 1400×560 px | No |
| Screenshots | 640×480 or 1280×800 px | No (max 6) |

Create these from screenshots of the extension (popup, settings, reader, a converted page).

---

## 6. Certification

- Review usually takes up to 7 business days
- Status in Partner Center will change to **In the Store** when approved
- If rejected, check the feedback and resubmit after fixes

---

## 7. Privacy Policy Hosting

If Partner Center requires a Privacy Policy URL:

1. Create a GitHub repo for the extension
2. Enable GitHub Pages and use `PRIVACY_POLICY.md` as the source, or
3. Convert `PRIVACY_POLICY.md` to HTML and host it on your own site
4. Use the resulting URL in Partner Center
