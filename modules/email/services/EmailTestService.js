const { sanitizeEmailHtml } = require('../utils/sanitize');

function checkSpamScore({ subject = '', htmlContent = '', fromEmail = '', textContent = '' }) {
  const html = htmlContent || '';
  const text = textContent || html.replace(/<[^>]+>/g, ' ');
  const issues = [];
  let score = 0;

  const spamWords = ['free', 'winner', 'click here', 'act now', 'limited time', '100%', 'guarantee', 'no obligation', 'risk free', 'cash', 'viagra', 'lottery'];
  const lowerSubject = subject.toLowerCase();
  const lowerText = text.toLowerCase();

  spamWords.forEach((word) => {
    if (lowerSubject.includes(word)) { issues.push({ type: 'spam_word', severity: 'high', message: `Subject contains spam trigger: "${word}"` }); score += 8; }
    if (lowerText.includes(word)) { issues.push({ type: 'spam_word', severity: 'medium', message: `Body contains spam trigger: "${word}"` }); score += 4; }
  });

  if (subject.length > 80) { issues.push({ type: 'subject_length', severity: 'low', message: 'Subject line is too long (>80 chars)' }); score += 3; }
  if (/[A-Z]{5,}/.test(subject)) { issues.push({ type: 'caps', severity: 'medium', message: 'Subject has excessive capital letters' }); score += 6; }
  if ((subject.match(/!/g) || []).length > 2) { issues.push({ type: 'punctuation', severity: 'low', message: 'Too many exclamation marks in subject' }); score += 4; }
  if (!fromEmail || !fromEmail.includes('@')) { issues.push({ type: 'from', severity: 'high', message: 'Invalid or missing From email address' }); score += 10; }

  const linkCount = (html.match(/<a\s/gi) || []).length;
  const imageCount = (html.match(/<img\s/gi) || []).length;
  const textLength = text.trim().length;

  if (linkCount > 10) { issues.push({ type: 'links', severity: 'medium', message: `Too many links (${linkCount})` }); score += 5; }
  if (imageCount > 0 && textLength < 100) { issues.push({ type: 'image_text_ratio', severity: 'high', message: 'Image-heavy email with little text' }); score += 12; }
  if (html.includes('display:none') || html.includes('font-size:0')) { issues.push({ type: 'hidden_text', severity: 'high', message: 'Hidden text detected (spam technique)' }); score += 15; }

  const ratio = html.length > 0 ? (html.match(/https?:\/\//gi) || []).length / Math.max(textLength, 1) : 0;
  if (ratio > 0.05) { issues.push({ type: 'link_density', severity: 'medium', message: 'High link-to-text ratio' }); score += 5; }

  score = Math.min(100, score);
  const rating = score >= 50 ? 'high_risk' : score >= 25 ? 'medium_risk' : score >= 10 ? 'low_risk' : 'good';

  return { score, rating, issues, recommendations: buildRecommendations(issues) };
}

function buildRecommendations(issues) {
  const recs = [];
  if (issues.some((i) => i.type === 'spam_word')) recs.push('Remove or replace common spam trigger words');
  if (issues.some((i) => i.type === 'caps')) recs.push('Use sentence case in subject line');
  if (issues.some((i) => i.type === 'image_text_ratio')) recs.push('Add more meaningful text content alongside images');
  if (issues.some((i) => i.type === 'hidden_text')) recs.push('Remove hidden text or zero-font-size content');
  if (issues.some((i) => i.type === 'links')) recs.push('Reduce number of links or spread across email');
  if (recs.length === 0) recs.push('Email looks good for deliverability');
  return recs;
}

function checkAccessibility({ subject = '', htmlContent = '', preheader = '' }) {
  const html = htmlContent || '';
  const issues = [];
  let score = 100;

  if (!preheader && !html.includes('preheader')) {
    issues.push({ type: 'preheader', severity: 'low', message: 'Missing preheader text for preview snippets' });
    score -= 5;
  }

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  imgTags.forEach((tag, i) => {
    if (!/alt\s*=\s*["'][^"']+["']/i.test(tag)) {
      issues.push({ type: 'alt_text', severity: 'high', message: `Image ${i + 1} missing alt text`, element: tag.slice(0, 60) });
      score -= 10;
    }
  });

  const links = html.match(/<a[^>]*>(.*?)<\/a>/gi) || [];
  links.forEach((link, i) => {
    const text = link.replace(/<[^>]+>/g, '').trim();
    if (!text || text.length < 2 || /^(click here|here|read more|link)$/i.test(text)) {
      issues.push({ type: 'link_text', severity: 'medium', message: `Link ${i + 1} has non-descriptive text: "${text || 'empty'}"` });
      score -= 5;
    }
  });

  if (!html.includes('<html') && html.length > 100) {
    issues.push({ type: 'structure', severity: 'low', message: 'Email lacks proper HTML document structure' });
    score -= 3;
  }

  const headingCount = (html.match(/<h[1-6]/gi) || []).length;
  if (html.length > 500 && headingCount === 0) {
    issues.push({ type: 'headings', severity: 'medium', message: 'Long email without heading structure' });
    score -= 5;
  }

  if (html.includes('<table') && !html.includes('role="presentation"')) {
    issues.push({ type: 'tables', severity: 'low', message: 'Layout tables should use role="presentation"' });
    score -= 3;
  }

  const fontSizeMatches = html.match(/font-size:\s*(\d+)px/gi) || [];
  fontSizeMatches.forEach((fs) => {
    const size = parseInt(fs.match(/\d+/)[0], 10);
    if (size < 12) {
      issues.push({ type: 'font_size', severity: 'medium', message: `Font size ${size}px may be too small for readability` });
      score -= 4;
    }
  });

  score = Math.max(0, score);
  const rating = score >= 80 ? 'good' : score >= 60 ? 'needs_improvement' : 'poor';

  return { score, rating, issues, passed: issues.filter((i) => i.severity === 'high').length === 0 };
}

function runEmailTests(data) {
  const sanitized = { ...data, htmlContent: sanitizeEmailHtml(data.htmlContent || '') };
  return {
    spam: checkSpamScore(sanitized),
    accessibility: checkAccessibility(sanitized),
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { checkSpamScore, checkAccessibility, runEmailTests };
