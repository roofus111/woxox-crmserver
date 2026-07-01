const sanitizeHtml = require('sanitize-html');

const DEFAULT_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'span', 'style']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['style', 'class', 'id'],
    img: ['src', 'alt', 'width', 'height'],
    a: ['href', 'name', 'target', 'rel'],
    table: ['border', 'cellpadding', 'cellspacing', 'width'],
    td: ['colspan', 'rowspan', 'width', 'align', 'valign'],
    th: ['colspan', 'rowspan', 'width', 'align', 'valign'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
};

function sanitizeEmailHtml(html) {
  if (!html) return '';
  return sanitizeHtml(html, DEFAULT_OPTIONS);
}

function sanitizePlainText(text) {
  if (!text) return '';
  return text.replace(/[<>]/g, '');
}

module.exports = { sanitizeEmailHtml, sanitizePlainText };
