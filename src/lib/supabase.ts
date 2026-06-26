import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qeaepulwqgsuxyowjfqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlYWVwdWx3cWdzdXh5b3dqZnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzc2MTUsImV4cCI6MjA5NzcxMzYxNX0.rM9vIuxgfY7wBQLGvEh3njZG5LBgBFTzxRNQzxZZCrA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);