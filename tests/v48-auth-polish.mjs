import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(p, 'utf8');
const c = read('components/premium-auth.tsx');
const css = read('app/premium-auth.css');
const w = read('components/workspace.tsx');

test('autofilled fields keep the dark field colour instead of a browser box', () => {
  assert.match(css, /input:-webkit-autofill/);
  assert.match(css, /-webkit-box-shadow:0 0 0 100px var\(--auth-field\) inset/);
  assert.match(css, /color-scheme:dark/);
});

test('buyer context is a dark choice group whose legend is never clipped', () => {
  assert.match(c, /className="hustle-buyer-context"/);
  assert.match(css, /\.hustle-buyer-context legend\{float:left;width:100%/);
  assert.doesNotMatch(css, /#f4fafc|#d6f5fb/);
  assert.match(c, /aria-pressed=\{buyerAudience==='business'\}/);
});

test('auth messages appear once, inside the form, and come into view', () => {
  assert.match(w, /\{error&&\(uid\|\|loading\)&&<div className="workspace-message error"/);
  assert.match(w, /\{notice&&\(uid\|\|loading\)&&<div className="workspace-message success"/);
  assert.match(c, /feedbackRef\.current\?\.scrollIntoView/);
});

test('registration shows a live password rule, resend countdown and legal links', () => {
  assert.match(c, /aria-describedby=\{register\?'hustle-auth-password-hint':undefined\}/);
  assert.match(c, /password\.length>=8/);
  assert.match(c, /emailCooldown>0\?t\('Дахин илгээх','Resend'\)\+' · '\+cooldown/);
  assert.match(c, /href="\/terms\/"/);
  assert.match(c, /href="\/privacy\/"/);
});

test('mobile inputs use 16px text so iOS does not zoom', () => {
  assert.match(css, /@media \(max-width:600px\)[\s\S]*\.hustle-auth-input input\{font-size:16px\}/);
});

