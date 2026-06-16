# Fitti - Healthy Breakfast. Fully Managed.

Fitti is a premium, high-end responsive web application for managing healthy breakfast plan subscriptions. Built with React, Vite, Framer Motion, Supabase (Database & Auth), and the Resend API (Transactional Receipts).

---

## Key Features

1. **Google OAuth 2.0 Auth & Onboarding**:
   - Seamless authentication via Google OAuth (Supabase Auth).
   - Structured onboarding form on first connection to capture user information (DOB, Age, structured addresses, and contact numbers).
   - Profile information is stored permanently in the database and preloaded automatically on subsequent sign-ins.

2. **Animated Welcome Ticket & Confetti**:
   - Confetti particle explosion and slide-out dispenser animation upon completing onboarding.
   - Automatically renders a unique welcome ticket featuring a randomized motivational quote from a 50+ wellness database.
   - Clean stylesheets designed for printing/downloading the receipt.

3. **Luxury Birthday Rewards**:
   - Detects if the current local date/month matches the user's birthdate.
   - Triggers an Awwwards-tier gold double-bezel birthday layout featuring floating SVG balloons, gift bags, and interactive coupon badges.
   - Applies a single-use 50% checkout discount.

4. **Custom Delivery Planner**:
   - Interactive weekday selector allows users to choose customized delivery days (e.g., custom schedules instead of consecutive days).
   - Syncs selected days directly with invoices and orders.

5. **Previous Orders History**:
   - Access order details, transaction references, item lists, and delivery statuses directly from the database profile view modal.

6. **Automated HTML receipts via Resend**:
   - Dispatches a custom-styled, elegant HTML email receipt containing line items, time slots, scheduling, and billing summaries.

---

## Security Hardening (Production Ready)

- **Ignored Credentials**: `.env` and local credentials files are excluded in `.gitignore` to prevent secret leakage to GitHub.
- **Dynamic Config**: Supabase credentials and Resend API tokens are fetched dynamically using Vite's `import.meta.env` system.
- **Secure RLS Policies**: Configured to restrict profiles and orders table CRUD access exclusively to the authenticated owner's email, preventing IDOR (Insecure Direct Object Reference).

---

## Environment Setup

Create a `.env` file in the root directory and define the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_RESEND_API_KEY=your_resend_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

```

*Note: In production, configure these variables directly in your hosting dashboard (Netlify, Vercel, etc.) instead of committing a `.env` file.*

---

## Database Configuration

Execute the following SQL queries in the Supabase SQL editor to create the required tables and configure Secure Row Level Security (RLS) policies:

```sql
-- 1. Profiles Table
create table public.profiles (
  id text not null primary key, -- Stores user email
  name text not null,
  email text not null,
  age integer not null,
  dob date not null,
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

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies to prevent IDOR
create policy "Allow user select own profile" on public.profiles
  for select using (auth.jwt() ->> 'email' = email);

create policy "Allow user insert own profile" on public.profiles
  for insert with check (auth.jwt() ->> 'email' = email);

create policy "Allow user update own profile" on public.profiles
  for update using (auth.jwt() ->> 'email' = email);


-- 2. Orders Table
create table public.orders (
  id text not null primary key,
  email text,
  full_name text,
  phone text,
  address text,
  area text,
  pincode text,
  landmark text,
  food_preference text,
  notes text,
  payment_method text,
  payer_name text,
  transaction_id text,
  razorpay_payment_id text,
  products jsonb,
  days integer,
  delivery_slot jsonb,
  schedule text,
  custom_delivery_days text[],
  total integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  payment_status text,
  order_status text
);

-- Enable RLS
alter table public.orders enable row level security;

-- Policies to prevent IDOR
create policy "Allow user select own orders" on public.orders
  for select using (auth.jwt() ->> 'email' = email);

create policy "Allow user insert own orders" on public.orders
  for insert with check (auth.jwt() ->> 'email' = email);

create policy "Allow user update own orders" on public.orders
  for update using (auth.jwt() ->> 'email' = email);
```

---

## Local Development & Build

### Install Dependencies
```bash
npm install
```

### Start Local Dev Server
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
```
The output will compile into the `dist/` directory.
