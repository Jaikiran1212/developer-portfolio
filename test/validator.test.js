import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeText, cleanString, isValidEmail, isValidUrl, validateContactForm } from '../api/_lib/validator.js';

test('sanitizeText escapes HTML entities to prevent XSS', () => {
  const malicious = '<script>alert("xss")</script>&<img src="x" onerror="alert(1)">';
  const sanitized = sanitizeText(malicious);
  assert.equal(sanitized.includes('<script>'), false);
  assert.equal(sanitized.includes('&lt;script&gt;'), true);
  assert.equal(sanitized.includes('&quot;'), true);
  assert.equal(sanitized.includes('&amp;'), true);
});

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
