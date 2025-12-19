# Developer Manual

## Overview

This document is intended for developers who will maintain or extend the Earnings Surprise Tracker. It explains how to set up the project locally, run the application, understand the backend APIs, and continue development.

## Technology Stack

- **Front End:** HTML, CSS, JavaScript  
- **Backend / Serverless APIs:** Node.js (Vercel Serverless Functions)  
- **Database:** Supabase (PostgreSQL)  
- **External APIs:** Alpha Vantage (Earnings & Earnings Calendar)  
- **JavaScript Libraries:**  
  - Chart.js (data visualization)  
  - Day.js (date formatting)  
  - PapaParse (CSV parsing)

## Project Structure

/

├── index.html          \# Home page

├── analyze.html        \# Main application page

├── about.html          \# About page

├── analyze.js          \# Front-end logic and Fetch API calls

├── /api

│   ├── earnings.js     \# Earnings API endpoint

│   └── calendar.js     \# Earnings calendar API endpoint

├── styles.css          \# Global styles

├── package.json        \# Dependencies and metadata

└── docs/               \# Project documentation

## Installation

1. Clone the repository:

git clone https://github.com/bequiss/INST377-Final-Project-Deliverable.git

cd INST377-Final-Project-Deliverable

2. Install dependencies:

npm install

This installs:

- **@supabase/supabase-js** – Supabase database client used by backend API routes  
- **papaparse** – CSV parsing library used for the earnings calendar API  
- **vercel** – Used for local development and deployment

**Note:** The following libraries are loaded via CDN and do not require installation:

- **Chart.js** – Used for data visualization  
- **Day.js** – Used for date formatting  
- Create environment variables (locally or in Vercel):

SUPABASE\_URL

SUPABASE\_SERVICE\_ROLE\_KEY

ALPHAVANTAGE\_API\_KEY

- The three aforementioned environment variables were saved into a .env.local file for local deployment  
- Those environment variables were then saved to Vercel for production

Database setup

- The Supabase URL and key can be found on the Supabase project page. Under “Project Settings” \-\> “API Keys” and “Data API.”  
- Used SQL to create tables to cache earnings calendar and earnings history data.

## Running the Application

This project is designed to run using **Vercel serverless functions**.

To run locally:

npx vercel env add (add each of the aforementioned environment variables) development  
npx vercel pull  
npx vercel dev

Then open your browser at:

http://localhost:3000

- For local development, run `npx vercel dev` and open the local URL shown in the terminal (typically [http://localhost:3000](http://localhost:3000)).  
- The production version of the application is deployed on Vercel at: [https://inst377-final-project-kappa.vercel.app/](https://inst377-final-project-kappa.vercel.app/)

## Testing

No automated tests are currently implemented.

Manual testing is recommended:

- Verify calendar data loads correctly  
- Confirm earnings analysis updates based on ticker input  
- Ensure charts render without errors

## API Documentation

### GET `/api/calendar`

**Description:** Retrieves upcoming earnings calendar data from Supabase. If the database is empty or `refresh=1` is passed, data is fetched from Alpha Vantage and stored.

**Query Parameters:**

- `refresh=1` (optional): Forces a refresh from Alpha Vantage  
- `meta=1` (optional): Returns metadata (row count and last ingestion time)  
  - If the table is empty, last\_ingested may not be in the response.

**Response Example:**

{

  "items": \[

    {

      "symbol": "AAPL",

      "name": "Apple Inc",

      "report\_date": "2025-01-30",

      "estimate": "2.10",

      "currency": "USD"

    }

  \]

}

---

### GET `/api/earnings`

**Description:** Fetches quarterly earnings data for a given ticker from Alpha Vantage, computes surprise percentages and ratings, and stores results in Supabase.

**Query Parameters:**

- `symbol`: Stock ticker symbol (defaults to `AAPL`)

**Response Example:**

{

  "symbol": "AAPL",

  "quarters": \[

    {

      "reported\_date": "2024-10-30",

      "reported\_eps": "1.64",

      "estimated\_eps": "1.60",

      "surprise\_pct": 2.5,

      "badge": "LOW"

    }

  \]

}

Deployment

1. Push to GitHub  
2. Import to Vercel (or alternatively deploy via CLI if GitHub is linked)  
3. Set production environment variables either on the Vercel dashboard or via CLI  
4. Deploy

## Known Limitations

- Alpha Vantage rate limits may restrict frequent refreshes  
- Some earnings data may be missing or delayed  
- No authentication or user accounts are implemented  
- Application is intended for informational purposes only

## Roadmap / Future Development

- Add user authentication and saved watchlists  
- Implement automated testing  
- Improve mobile responsiveness  
- Add more advanced analytics (volatility, price reaction)  
- Cache API results more aggressively to reduce rate‑limit risk

---

**Disclaimer:** This application is for educational purposes only and does not constitute financial advice.  