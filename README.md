# Gift Card Tracking System

A simple static site to track gift card distributions for grant outreach programs.

## Features

- **Data Entry Page**: Employees can record gift card distributions
- **Admin Dashboard**: View inventory, track distributions, export to CSV
- **Real-time Inventory**: See remaining cards as distributions are recorded
- **Filtering**: Filter by card type and date range

## Initial Inventory

| Card Type | Count |
|-----------|-------|
| Pronto | 100 |
| 7-Eleven | 7 |
| Grocery Outlet | 15 |
| Wendy's | 40 |

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be provisioned

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create tables and seed data

### 3. Configure the App

1. In Supabase, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. Edit `js/config.js` and replace the placeholders:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 4. Deploy to Vercel

**Option A: Via Git**

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will automatically deploy the static site

**Option B: Via CLI**

```bash
npm install -g vercel
cd giftcard-tracker
vercel
```

### 5. Test Locally (Optional)

```bash
# Using npx (no install needed)
npx serve

# Or with Python
python -m http.server 8000
```

Then open http://localhost:5000 (or 8000 for Python)

## File Structure

```
giftcard-tracker/
├── index.html          # Employee data entry form
├── admin.html          # Admin dashboard
├── css/
│   └── styles.css      # Shared styles
├── js/
│   ├── config.js       # Supabase configuration
│   ├── entry.js        # Data entry page logic
│   └── admin.js        # Admin dashboard logic
├── supabase/
│   └── schema.sql      # Database schema and seed data
└── README.md           # This file
```

## Usage

### Recording Distributions

1. Go to the **Data Entry** page
2. Fill in recipient name, UID, card type, quantity, and date
3. Add optional notes
4. Click "Record Distribution"

### Managing Distributions (Admin)

1. Go to the **Admin Dashboard**
2. View inventory summary at the top
3. Filter distributions by card type or date range
4. Export filtered results to CSV
5. Delete incorrect entries if needed

## Data Fields

| Field | Description |
|-------|-------------|
| Name | Recipient's full name |
| UID | Unique identifier for the recipient |
| Date | Date the card was distributed |
| Card Type | Type of gift card (Pronto, 7-Eleven, etc.) |
| Quantity | Number of cards given |
| Notes | Optional additional information |

## Troubleshooting

**"Error loading card types"**
- Check that your Supabase URL and key are correct in `config.js`
- Verify the database schema was created successfully

**Inventory shows 0 for all cards**
- Make sure you ran the full `schema.sql` including the INSERT statements

**Can't delete distributions**
- Check Supabase Row Level Security policies are set up correctly
