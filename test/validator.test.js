import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeText, cleanString, isValidEmail, isValidUrl, validateContactForm } from '../api/_lib/validator.js';

test('cleanString strips null bytes and trims', () => {
  const dirty = '  hello\0world  ';
  assert.equal(cleanString(dirty), 'helloworld');
  assert.equal(cleanString(null), '');
  assert.equal(cleanString(123), '');
});

test('isValidEmail validates RFC format strictly', () => {
  assert.equal(isValidEmail('jaikiranjp@gmail.com'), true);
  assert.equal(isValidEmail('user.name+tag@sub.domain.co'), true);
  assert.equal(isValidEmail('plainaddress'), false);
  assert.equal(isValidEmail('@missingusername.com'), false);
  assert.equal(isValidEmail('username@.com'), false);
  assert.equal(isValidEmail(''), false);
});

test('isValidUrl allows valid URLs and blocks javascript: schemes', () => {
  assert.equal(isValidUrl('https://github.com/Jaikiran1212'), true);
  assert.equal(isValidUrl('http://localhost:3000'), true);
  assert.equal(isValidUrl('mailto:jaikiranjp@gmail.com'), true);
  assert.equal(isValidUrl('tel:+919445187244'), true);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('not a url'), false);
  assert.equal(isValidUrl('', true), true);
  assert.equal(isValidUrl('', false), false);
});

test('validateContactForm catches spam honeypot', () => {
  const spam = {
    name: 'Bot',
    email: 'bot@spam.com',
    subject: 'Spam subject',
    message: 'Buy cheap things now',
    website_trap: 'http://spam.ru',
  };
  const result = validateContactForm(spam);
  assert.equal(result.isValid, false);
  assert.equal(result.isSpam, true);
});

test('validateContactForm rejects invalid lengths', () => {
  const shortMsg = {
    name: 'J',
    email: 'bad-email',
    subject: '',
    message: 'hi',
  };
  const result = validateContactForm(shortMsg);
  assert.equal(result.isValid, false);
  assert.equal(result.errors.length >= 3, true);
});

test('validateContactForm accepts clean submission and sanitizes', () => {
  const clean = {
    name: 'Recruiter Jane',
    email: 'jane.recruiter@company.com',
    subject: 'Internship Opportunity at Tech Corp',
    message: 'Hi Jai Kiran, we loved your DLX visualizer project and would like to interview you!',
  };
  const result = validateContactForm(clean);
  assert.equal(result.isValid, true);
  assert.equal(result.data.name, 'Recruiter Jane');
  assert.equal(result.data.email, 'jane.recruiter@company.com');
});

// ---- Added with the security review -------------------------------------------------
import { isSafeSvg, validateIconValue, validatePhotoConfig, escapeHtml } from '../api/_lib/validator.js';

test('sanitizeText stores text RAW (escaping happens only on output)', () => {
  assert.equal(sanitizeText("Knuth's & \"quotes\" <b>"), "Knuth's & \"quotes\" <b>");
  assert.equal(escapeHtml("a&b<'>"), 'a&amp;b&lt;&#x27;&gt;');
});

test('isSafeSvg blocks scripts, handlers, foreignObject and external hrefs', () => {
  assert.equal(isSafeSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg>'), true);
  assert.equal(isSafeSvg('<svg viewBox="0 0 10 10"><use href="#a"/></svg>'), true);
  assert.equal(isSafeSvg('<svg onload="alert(1)"></svg>'), false);
  assert.equal(isSafeSvg('<svg><script>alert(1)</script></svg>'), false);
  assert.equal(isSafeSvg('<svg><foreignObject><div/></foreignObject></svg>'), false);
  assert.equal(isSafeSvg('<svg><a href="javascript:alert(1)"><path/></a></svg>'), false);
  assert.equal(isSafeSvg('<svg><image href="https://evil.com/x.png"/></svg>'), false);
  assert.equal(isSafeSvg('<div>not svg</div>'), false);
});

test('validateIconValue classifies slugs, svgs, urls and rejects junk', () => {
  assert.equal(validateIconValue('React').value, 'react');
  assert.equal(validateIconValue('https://cdn.example.com/i.svg').type, 'url');
  assert.equal(validateIconValue('javascript:alert(1)').ok, false);
  assert.equal(validateIconValue('data:text/html;base64,AAAA').ok, false);
  assert.equal(validateIconValue('').ok, false);
});

test('validatePhotoConfig clamps ranges and rejects oversized inline images', () => {
  const v = validatePhotoConfig({ src: '/images/profile.png', width: 99999, height: 1, scale: 9, x: -9999, feather: 0, frame: 'nope', autoCutout: 1 });
  assert.equal(v.ok, true);
  assert.equal(v.value.width, 800);
  assert.equal(v.value.height, 240);
  assert.equal(v.value.scale, 2.5);
  assert.equal(v.value.x, -300);
  assert.equal(v.value.feather, 0); // 0 is a valid value
  assert.equal(v.value.frame, 'cutout');
  assert.equal(validatePhotoConfig({ src: 'data:image/png;base64,' + 'A'.repeat(250000) }).ok, false);
  assert.equal(validatePhotoConfig({ src: 'javascript:alert(1)' }).ok, false);
});
