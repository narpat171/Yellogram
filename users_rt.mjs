import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://pjwixcoapccpqbfrwntv.supabase.co';
const supabaseKey = 'sb_publishable_YkgwTYE7NMzRYDoZHaANbQ_MjZUQf9n';

const results = [];
function finish() {
  fs.writeFileSync('C:/Users/ns797/AppData/Local/Temp/opencode/users_rt.txt', results.join('\n'));
  setTimeout(() => process.exit(0), 300);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const channel = supabase
  .channel('diag-users')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
    results.push('USERS UPDATE EVENT: ' + payload.new.id.slice(0, 8) + ' last_seen=' + (payload.new.last_seen || 'none'));
  })
  .subscribe((status, err) => {
    results.push('CHANNEL STATUS: ' + status + (err ? ' ERR=' + JSON.stringify(err) : ''));
    if (status === 'SUBSCRIBED') {
      results.push('Subscribed to users table. Waiting 45s for heartbeat updates...');
      setTimeout(() => {
        const gotEvents = results.some(r => r.includes('USERS UPDATE EVENT'));
        results.push('=== 45s: ' + (gotEvents ? 'REALTIME WORKS for users table' : 'NO realtime events (publication/RLS issue)') + ' ===');
        finish();
      }, 45000);
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      finish();
    }
  });

setTimeout(() => { results.push('=== 50s timeout ==='); finish(); }, 50000);
