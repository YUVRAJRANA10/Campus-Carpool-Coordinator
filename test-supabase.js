import { createClient } from '@supabase/supabase-js'

// Test Supabase connection
const supabaseUrl = 'https://tybswknibelqgewmocfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YnN3a25pYmVscWdld21vY2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzQzNTMsImV4cCI6MjA3ODg1MDM1M30.dCoJ4AkSyOrKLNB2wR0iSA1S8sejK1OrSWhQ2anlCFk'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Supabase client created:', supabase)

// Test connection
supabase.auth.getSession().then(result => {
  console.log('Supabase connection test:', result)
}).catch(error => {
  console.error('Supabase connection error:', error)
})

export { supabase }