# ReliefSync - AI-driven Community Crisis Detection and Volunteer Matching System

ReliefSync is a production-ready MVP built for hackathons to ingest unstructured crisis reports, extract structured data using Google Gemini AI, detect crisis spikes, predict impact, and intelligently match volunteers to problems.

## Tech Stack
- **Backend**: Python (FastAPI)
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini API (gemini-1.5-pro-latest)
- **Frontend**: React (Vite)

## System Architecture
1. **Data Ingestion**: Raw reports are ingested via frontend and passed to FastAPI.
2. **AI Processing**: Gemini extracts `issue_type`, `severity`, `urgency`, `location`, `people_affected`, and `summary`.
3. **Storage**: Stored in Supabase for high availability.
4. **Crisis Spikes**: FastAPI endpoint compares current 24-hour frequency vs 7-day baseline to trigger alerts.
5. **Impact Prediction**: Gemini forecasts short-term consequences and recommended actions based on issue severity and type.
6. **Volunteer Matching**: Simple AI heuristic matches proximity, urgency, and relevant skills to suggest top volunteers.

## How to Run Locally

### 1. Prerequisites
- Python 3.9+
- Node.js v18+
- Supabase account
- Google Gemini API key

### 2. Database Setup (Supabase)
1. Create a new Supabase project.
2. Run the SQL schema from `backend/schema.sql` in the Supabase SQL Editor.
3. Keep your Supabase URL and Anon Key handy.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Create .env file based on .env.example
cp .env.example .env
# Edit .env and add your SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY
```

Run the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Hackathon Demo Steps
1. Navigate to the **Submit Report** tab.
2. Paste unstructured text like: *"Massive flooding near the south river bank. Water rising fast. 10 families stranded without power."*
3. Watch the system instantly structure it.
4. Go to the **Dashboard** to see the issue listed. Submitting multiple reports in the same location will trigger a **Crisis Spike Alert**.
5. Navigate to the **Volunteers** tab and select the new issue.
6. Observe the Gemini **AI Impact Prediction** and the matched volunteers.

---

*Focus on Clarity, Speed, and Hackathon Usability.*
