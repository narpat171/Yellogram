// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// 🔥 बदलाव: अंत से '/rest/v1/' हटा दिया गया है!
const supabaseUrl = 'https://pjwixcoapccpqbfrwntv.supabase.co' 

const supabaseAnonKey = 'sb_publishable_YkgwTYE7NMzRYDoZHaANbQ_MjZUQf9n' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)