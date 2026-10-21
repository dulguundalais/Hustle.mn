import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('marketplace auth client uses cookie-backed Supabase SSR browser client', () => {
  const source = read('lib/marketplace/client.ts');
  assert.match(source, /import\s*\{\s*createBrowserClient\s*\}\s*from\s*['"]@supabase\/ssr['"]/);
  assert.match(source, /return\s+createBrowserClient\(config\.url,\s*config\.key\)/);
  assert.doesNotMatch(source, /createClient\(config\.url,\s*config\.key/);
});

test('Next server routes read the same Supabase SSR cookie storage', () => {
  const source = read('lib/supabase/server.ts');
  assert.match(source, /createServerClient/);
  assert.match(source, /getAll\(\)/);
  assert.match(source, /setAll\(/);
});

test('auth code callback redirects only after PKCE session exchange', () => {
  const source = read('app/auth/callback/route.ts');
  assert.match(source, /exchangeCodeForSession\(code\)/);
  assert.match(source, /\/workspace\//);
  assert.match(source, /missing_code/);
});
