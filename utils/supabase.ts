import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Values come from app.json → expo.extra.supabase
// The anon key is safe to ship in the client (protected by Row Level Security).
const { url, anonKey } = Constants.expoConfig?.extra?.supabase ?? {};

if (!url || !anonKey) {
  console.warn('[supabase] Missing url/anonKey in app.json extra.supabase');
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storage: AsyncStorage,        // persist session in RN
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,    // no browser URL handling in RN
  },
});

/**
 * P1 connectivity check: ping the keepalive table.
 * Returns true if the backend responded.
 */
export async function pingBackend(): Promise<boolean> {
  try {
    const { error } = await supabase.from('keepalive').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
