import { createClient } from '@supabase/supabase-js';

// Read values from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client only if configuration is provided
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/* 
  =======================================================
  SUPABASE DATABASE SCHEMA SETUP
  =======================================================
  To set up your database in Supabase, run the following SQL
  in your Supabase SQL Editor:

  -- 1. Create the profiles table
  create table public.profiles (
    id text not null primary key, -- Stores user email
    name text,
    email text,
    age integer,
    dob date,
    house_no text,
    street text,
    area text,
    locality text,
    city text,
    pincode text,
    state text,
    phone_number_1 text,
    phone_number_2 text,
    birthday_discount_used boolean default false,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- 2. Enable Row Level Security (RLS)
  alter table public.profiles enable row level security;

  -- 3. Create RLS Policies
  create policy "Enable read access for all users" on public.profiles
    for select using (true);

  create policy "Enable insert for all users" on public.profiles
    for insert with check (true);

  create policy "Enable update for all users" on public.profiles
    for update using (true);
*/
