// ==============================================================================
// UNIT TESTS: BRAND LOGO SYSTEM & MULTI-FONT TYPOGRAPHY
// ==============================================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOGO_PRESETS, getLogoSvg, toFaviconUri } from '../src/js/brand-logo.js';
import { FONT_PRESETS } from '../src/js/portfolio.js';
import { memoryStore } from '../api/_lib/supabase.js';

test('Brand Logo System - provides 5 built-in vector presets', () => {
  const presetKeys = Object.keys(LOGO_PRESETS);
  assert.equal(presetKeys.length, 5);
  assert.deepEqual(presetKeys.sort(), [
    'cyber-knot',
    'hex-ribbon',
    'minimal-seal',
    'neon-prism',
    'quantum-fold',
  ].sort());
});

test('Brand Logo System - hex-ribbon is the default preset with Tomasz Gajda monogram inspiration', () => {
  const defaultPreset = LOGO_PRESETS['hex-ribbon'];
  assert.ok(defaultPreset);
  assert.equal(defaultPreset.isDefault, true);
  assert.match(defaultPreset.description, /Tomasz Gajda/i);

  const svg = getLogoSvg('hex-ribbon');
  assert.match(svg, /<svg/);
  assert.match(svg, /viewBox="0 0 100 100"/);
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test('Brand Logo System - generates valid SVGs for all 5 presets', () => {
  for (const presetId of Object.keys(LOGO_PRESETS)) {
    const svg = getLogoSvg(presetId, { primary_color: '#22d3ee', secondary_color: '#8b5cf6' });
    assert.ok(svg.startsWith('<svg'), `Preset ${presetId} must produce valid SVG start tag`);
    assert.ok(svg.endsWith('</svg>'), `Preset ${presetId} must produce valid SVG end tag`);
    assert.match(svg, /viewBox="0 0 100 100"/);
  }
});

test('Brand Logo System - toFaviconUri converts SVG string into data URI for browser tab favicon sync', () => {
  const svg = getLogoSvg('hex-ribbon');
  const uri = toFaviconUri(svg);
  assert.ok(uri.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.match(uri, /xmlns/);

  // Custom PNG/JPG URL is passed through intact
  const customUrl = 'https://example.com/my-logo.png';
  assert.equal(toFaviconUri(customUrl), customUrl);
});

test('Typography Suite - provides 5 presets covering Syne, Space Grotesk, Outfit, Instrument Serif, JetBrains Mono, Fira Code', () => {
  const presetNames = Object.keys(FONT_PRESETS);
  assert.equal(presetNames.length, 5);

  const allDisplays = presetNames.map((p) => FONT_PRESETS[p][0]);
  assert.ok(allDisplays.includes('Syne'));
  assert.ok(allDisplays.includes('Space Grotesk'));
  assert.ok(allDisplays.includes('Outfit'));

  const allMonos = presetNames.map((p) => FONT_PRESETS[p][1]);
  assert.ok(allMonos.includes('JetBrains Mono'));
  assert.ok(allMonos.includes('Fira Code'));

  const allSerifs = presetNames.map((p) => FONT_PRESETS[p][2]);
  allSerifs.forEach((s) => assert.equal(s, 'Instrument Serif'));
});

test('Memory Store - contains initial logo_config with hex-ribbon default', () => {
  assert.ok(memoryStore.profile.logo_config);
  assert.equal(memoryStore.profile.logo_config.preset, 'hex-ribbon');
});
