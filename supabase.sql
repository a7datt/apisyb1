-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  api_key TEXT UNIQUE,
  shamcash_address TEXT,
  address_confirmed BOOLEAN DEFAULT false,
  balance_usd NUMERIC DEFAULT 0,
  balance_syp NUMERIC DEFAULT 0,
  plan TEXT DEFAULT 'basic',
  daily_count INTEGER DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  original_amount NUMERIC NOT NULL,
  unique_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, expired, rejected, withdrawn
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create incoming_payments table
CREATE TABLE incoming_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  raw_text TEXT NOT NULL,
  amount NUMERIC,
  currency TEXT,
  matched_invoice_id UUID REFERENCES invoices(id),
  matched_user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'unmatched', -- matched, unmatched
  received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create withdrawals table
CREATE TABLE withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  shamcash_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoming_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Incoming payments policies (Only service role can access)
CREATE POLICY "Service role full access to incoming_payments" ON incoming_payments USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
