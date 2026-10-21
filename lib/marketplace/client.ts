'use client';
import {createBrowserClient} from '@supabase/ssr';
import type {SupabaseClient} from '@supabase/supabase-js';

let instance: Promise<SupabaseClient> | undefined;

export function marketplaceClient() {
  if (!instance) {
    instance = fetch('/api/config')
      .then(async response => {
        if (!response.ok) throw new Error('Бета орчин тохируулагдаагүй / Beta environment not configured');
        const config = await response.json();
        if (!config.url || !config.key) throw new Error('Missing public configuration');
        // Use the same cookie-backed PKCE session storage as Next.js server handlers.
        // A regular supabase-js client uses localStorage; the server cannot read it.
        return createBrowserClient(config.url, config.key);
      })
      .catch(error => {
        instance = undefined;
        throw error;
      });
  }
  return instance;
}
