/**
 * ADHD Reading Helper - Document Reader
 * Parses TXT, PDF, DOCX, ODT and displays with bionic reading, preserving layout
 */
import { getDocument, GlobalWorkerOptions } from './lib/pdf.min.mjs';

GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');

const ACCEPTED = {
  'text/plain': parseTxt,
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx,
  'application/vnd.oasis.opendocument.text': parseOdt
};

const zone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const chooseBtn = document.getElementById('chooseBtn');
const content = document.getElementById('content');
const controls = document.getElementById('controls');
const strengthEl = document.getElementById('strength');
const strengthVal = document.getElementById('strengthVal');
const backLink = document.getElementById('backLink');

backLink.href = chrome.runtime.getURL('popup.html');

chooseBtn.addEventListener('click', () => fileInput.click());
zone.addEventListener('click', (e) => {
  if (e.target === zone || e.target.closest('p')) {
    fileInput.click();
  }
});
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  zone.classList.remove('dragover');
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) handleFile(f);
});

chrome.storage.sync.get({ strength: 3 }, (items) => {
  strengthEl.value = items.strength;
  strengthVal.textContent = items.strength;
});

strengthEl.addEventListener('input', () => {
  const v = parseInt(strengthEl.value, 10);
  strengthVal.textContent = v;
  chrome.storage.sync.set({ strength: v });
  const data = content.dataset.result;
  if (data) {
    const parsed = JSON.parse(data);
    renderResult(parsed, v);
  }
});

function handleFile(file) {
  const type = file.type;
  const parser = ACCEPTED[type] || guessParser(file.name);
  if (!parser) {
    content.classList.remove('document-content');
    content.innerHTML = '<p class="error">Unsupported format. Use TXT, PDF, DOCX, or ODT.</p>';
    return;
  }
  content.classList.remove('document-content');
  content.innerHTML = '<p class="loading">Loading…</p>';
  controls.style.display = 'flex';
  parser(file)
    .then((result) => {
      content.dataset.result = JSON.stringify(result);
      const s = parseInt(strengthEl.value, 10);
      renderResult(result, s);
    })
    .catch((err) => {
      content.classList.remove('document-content');
      content.innerHTML = '<p class="error">Could not read file: ' + (err.message || err) + '</p>';
    });
}

function guessParser(name) {
  const ext = (name || '').toLowerCase().split('.').pop();
  if (ext === 'txt') return parseTxt;
  if (ext === 'pdf') return parsePdf;
  if (ext === 'docx') return parseDocx;
  if (ext === 'odt') return parseOdt;
  return null;
}

function parseTxt(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ type: 'text', text: r.result || '' });
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsText(file);
  });
}

async function parsePdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await getDocument(buf).promise;
  const numPages = pdf.numPages;
  const pages = [];
  const scale = 2;
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    pages.push({ page, viewport, textContent });
  }
  return { type: 'pdf', pages };
}

async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  if (result.messages.length) console.warn('Mammoth messages:', result.messages);
  return { type: 'html', html: result.value };
}

async function parseOdt(file) {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('content.xml')?.async('string');
  if (!xml) throw new Error('Invalid ODT');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const html = odtToHtml(doc);
  return { type: 'html', html };
}

function odtToHtml(doc) {
  const tableNs = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
  const officeNs = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
  const parts = [];
  const getLocal = (el) => (el.localName || el.nodeName || '').toLowerCase();
  const walk = (el) => {
    const local = getLocal(el);
    if (local === 'h') {
      const level = parseInt(el.getAttribute('outline-level') || el.getAttributeNS(officeNs, 'outline-level') || '1', 10);
      parts.push('<h' + Math.min(level, 6) + '>' + escapeHtml(el.textContent || '') + '</h' + Math.min(level, 6) + '>');
      return;
    }
    if (local === 'p') {
      parts.push('<p>' + escapeHtml(el.textContent || '') + '</p>');
      return;
    }
    if (local === 'list') {
      parts.push('<ul>');
      for (const li of el.children || []) {
        if (getLocal(li) === 'list-item') {
          for (const c of li.children || []) {
            if (getLocal(c) === 'p' || getLocal(c) === 'h') {
              parts.push('<li>' + escapeHtml(c.textContent || '') + '</li>');
            } else if (getLocal(c) === 'list') {
              walk(c);
            }
          }
        }
      }
      parts.push('</ul>');
      return;
    }
    if (local === 'table') {
      parts.push('<table class="odt-table">');
      const rows = el.getElementsByTagNameNS(tableNs, 'table-row');
      for (let r = 0; r < rows.length; r++) {
        parts.push('<tr>');
        const cells = rows[r].getElementsByTagNameNS(tableNs, 'table-cell');
        for (let c = 0; c < cells.length; c++) {
          parts.push('<td>' + escapeHtml(cells[c].textContent || '') + '</td>');
        }
        parts.push('</tr>');
      }
      parts.push('</table>');
      return;
    }
    for (const c of el.children || []) walk(c);
  };
  const body = doc.getElementsByTagNameNS(officeNs, 'body')[0];
  if (body) {
    const text = body.getElementsByTagNameNS(officeNs, 'text')[0];
    if (text) {
      for (const child of text.children || []) walk(child);
    }
  }
  return parts.join('') || '<p>' + escapeHtml(doc.documentElement.textContent) + '</p>';
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function applyBionicToElement(el, strength) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.textContent.trim()) nodes.push(n);
  }
  nodes.forEach((node) => BIONIC_READER.processTextNode(node, strength));
}

function renderResult(result, strength) {
  content.classList.add('document-content');
  if (result.type === 'text') {
    const html = BIONIC_READER.textToBionic(result.text, strength);
    const paras = html.split(/\n+/).filter(Boolean);
    content.innerHTML = paras.map((p) => '<p>' + p + '</p>').join('');
    return;
  }
  if (result.type === 'html') {
    content.innerHTML = result.html;
    applyBionicToElement(content, strength);
    return;
  }
  if (result.type === 'pdf') {
    renderPdf(result.pages, strength);
  }
}

async function renderPdf(pages, strength) {
  content.innerHTML = '';
  for (let i = 0; i < pages.length; i++) {
    const { page, viewport, textContent } = pages[i];
    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.style.position = 'relative';
    pageDiv.style.marginBottom = '2rem';
    pageDiv.style.background = '#fff';
    pageDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageDiv.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.className = 'pdf-text-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = viewport.width + 'px';
    overlay.style.height = viewport.height + 'px';
    overlay.style.pointerEvents = 'auto';
    overlay.style.overflow = 'hidden';

    const items = textContent.items.map((it) => {
      const tx = it.transform;
      const scale = viewport.scale;
      return {
        str: it.str,
        x: tx[4],
        y: viewport.height - tx[5],
        fontSize: Math.abs(tx[0]) * scale,
        width: it.width * scale,
        height: it.height * scale
      };
    });

    const lineTolerance = 8;
    const lines = [];
    let currentLine = [];
    let lastY = -999;
    for (const it of items) {
      if (currentLine.length && Math.abs(it.y - lastY) > lineTolerance) {
        lines.push(currentLine);
        currentLine = [];
      }
      currentLine.push(it);
      lastY = it.y;
    }
    if (currentLine.length) lines.push(currentLine);

    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      for (const it of line) {
        const span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.left = it.x + 'px';
        span.style.top = (it.y - it.fontSize) + 'px';
        span.style.fontSize = it.fontSize + 'px';
        span.style.lineHeight = '1.2';
        span.style.whiteSpace = 'nowrap';
        span.innerHTML = BIONIC_READER.textToBionic(it.str, strength);
        overlay.appendChild(span);
      }
    }

    pageDiv.appendChild(overlay);
    content.appendChild(pageDiv);
  }
}
