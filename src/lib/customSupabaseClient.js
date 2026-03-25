import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohddhnegsqvxhyohgsoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZGRobmVnc3F2eGh5b2hnc29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Njg4MDcsImV4cCI6MjA3MjU0NDgwN30.C_KwnZVRnMOKWyr9_rNIhfMq5NHLv1AimKH-UX7qVO0';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
