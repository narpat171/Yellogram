import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://pjwixcoapccpqbfrwntv.supabase.co';
const supabaseKey = 'sb_publishable_YkgwTYE7NMzRYDoZHaANbQ_MjZUQf9n';

const results = [];
function finish() {
  fs.writeFileSync('C:/Users/ns797/AppData/Local/Temp/opencode/rt_diag.txt', results.join('\n'));
  setTimeout(() => process.exit(0), 300);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const channel = supabase
  .channel('diag-postgres-messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
    results.push('EVENT RECEIVED: ' + JSON.stringify(payload.new));
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
    results.push('USERS EVENT: ' + payload.eventType + ' ' + JSON.stringify(payload.new));
  })
  .subscribe((status, err) => {
    results.push('CHANNEL STATUS: ' + status + (err ? ' ERR=' + JSON.stringify(err) : ''));
    if (status === 'SUBSCRIBED') {
      results.push('SUBSCRIBED OK - waiting for events...');
      setTimeout(() => {
        results.push('=== 10s: ' + (results.some(r => r.includes('EVENT RECEIVED')) ? 'EVENTS CAME' : 'NO EVENTS (table not in realtime publication OR RLS blocks)') + ' ===');
        finish();
      }, 10000);
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      finish();
    }
  });

setTimeout(() => { results.push('=== 15s timeout ==='); finish(); }, 15000);
