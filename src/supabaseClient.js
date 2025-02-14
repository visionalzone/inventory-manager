import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://atvvplxpjgcdakwedjdd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnZwbHhwamdjZGFrd2VkamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDY3NTYsImV4cCI6MjA1NTEyMjc1Nn0.gwP0KAyG3QihU88HVrslFH7SE0aiNyHogR2JYjESHRI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)