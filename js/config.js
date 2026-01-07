// Supabase Configuration
const SUPABASE_URL = 'https://shakqpysnrrsdjjxavce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYWtxcHlzbnJyc2RqanhhdmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjA3NzQsImV4cCI6MjA4MzM5Njc3NH0.q7O6Ot4ycJvXqUdqQ4XbV_z7SYaD5Lehm3-yPWdte-8';

// Initialize Supabase client (CDN exposes it as supabase.createClient)
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
