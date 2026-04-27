import os
import json
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
import google.generativeai as genai
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ReliefSync API", description="AI-driven Community Crisis Detection")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if SUPABASE_URL and SUPABASE_URL.startswith("http") and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("WARNING: Supabase credentials not found or invalid in environment.")

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    print("WARNING: Gemini API key not found in environment.")

class ReportRequest(BaseModel):
    content: str

class VolunteerRequest(BaseModel):
    name: str
    skills: list[str]
    location: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    location: str
    skills: list[str]
    phone_number: str = None
    ngo_member: bool = False
    ngo_name: str = None
    ngo_role: str = None
    ngo_website: str = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: str
    location: str
    skills: list[str]
    availability: bool = True
    avatar_url: str = None
    phone_number: str = None
    ngo_member: bool = False
    ngo_name: str = None
    ngo_role: str = None
    ngo_website: str = None

class AssignmentRequest(BaseModel):
    issue_id: int

class TeamCreate(BaseModel):
    name: str
    description: str = None
    image_url: str = None

class TeamJoin(BaseModel):
    team_id: int

async def get_current_user(authorization: str = Header(None)):
    """Dependency to verify Supabase JWT and return user info."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
        # Verify with Supabase
        user_res = supabase.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        return user_res.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def process_report_with_gemini(content: str):
    """Uses Gemini to extract structured issue data from unstructured text."""
    if not model:
        raise Exception("Gemini model not configured")
    
    prompt = f"""
    Analyze the following disaster/crisis report (which may be in any language) and extract structured data.
    IMPORTANT: You must translate everything to English. ALL text values in the output JSON must be in English.
    Return ONLY a raw JSON object (no markdown formatting, no comments) with the following exact keys:
    - issue_type (string, e.g., "Flood", "Medical Emergency", "Power Outage")
    - severity (integer 1-5, where 5 is most severe)
    - urgency (string: "low", "medium", or "high")
    - location (string)
    - people_affected (integer)
    - summary (string, concise 1-2 sentence summary in English)
    - recommended_procedure (string, detailed recommended step-by-step procedure to address or fix this specific issue)
    
    Report:
    {content}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        return data
    except Exception as e:
        print(f"Gemini Processing Error (likely quota): {e}")
        # Return fallback data so the app doesn't crash
        # Improved Fallback Logic
        issue_type = "Emergency"
        if "flood" in content.lower(): issue_type = "Flood"
        elif "fire" in content.lower(): issue_type = "Fire"
        elif "medical" in content.lower(): issue_type = "Medical"
        
        # Simple Location Extraction Fallback
        location = "General Area"
        words = content.split()
        for i, word in enumerate(words):
            if word.lower() in ["in", "near", "at"] and i + 1 < len(words):
                location = words[i+1].strip(".,!").capitalize()
                break

        return {
            "issue_type": issue_type,
            "severity": 3,
            "urgency": "medium",
            "location": location,
            "people_affected": 0,
            "summary": content[:100] + "...",
            "recommended_procedure": "1. Assess the situation.\n2. Proceed with standard emergency protocols.\n3. Await further instructions."
        }

def predict_impact_with_gemini(issue_type, severity, people_affected):
    """Uses Gemini to predict the impact of an unresolved issue."""
    if not model:
        return None
        
    prompt = f"""
    Based on the following ongoing crisis issue, predict the potential impact if it remains unresolved.
    Return ONLY a raw JSON object (no markdown formatting) with exact keys:
    - short_term_consequences (list of strings)
    - affected_sectors (list of strings, e.g., ["health", "infrastructure"])
    - impact_level (string: "low", "moderate", "severe", "catastrophic")
    - recommended_action (string, immediate next step)
    
    Issue Details:
    - Type: {issue_type}
    - Severity: {severity}/5
    - People Affected: {people_affected}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Impact Prediction Error (likely quota): {e}")
        return {
            "short_term_consequences": ["Prediction temporarily unavailable (Quota reached)"],
            "affected_sectors": ["unknown"],
            "impact_level": "unknown",
            "recommended_action": "Proceed with standard emergency protocols."
        }

def is_ngo_verified(vol):
    """Check if a volunteer is NGO-affiliated with complete details."""
    return (
        vol.get('ngo_member') == True
        and vol.get('ngo_name') not in (None, '')
        and vol.get('ngo_role') not in (None, '')
        and vol.get('ngo_website') not in (None, '')
    )

def run_ai_matching(issue_id, issue):
    """Triggers AI matching for a specific issue and caches recommendations.
    Only NGO-verified volunteers are included in AI recommendations."""
    if not model or not supabase:
        return None
        
    print(f"DEBUG: Running immediate AI matching for issue {issue_id}")
    
    # 1. Fetch available volunteers (only NGO-verified ones for AI matching)
    vols_res = supabase.table("volunteers").select("*").eq("availability", True).execute()
    available_vols = [v for v in vols_res.data if is_ngo_verified(v)]
    
    if not available_vols:
        print("DEBUG: No NGO-verified volunteers available for AI matching")
        return []

    # 2. Call Gemini for ranking
    prompt = f"""
    Rank these {len(available_vols)} volunteers for this crisis.
    CRISIS: {issue['issue_type']} at {issue['location']} (Severity: {issue['severity']})
    VOLUNTEERS: {json.dumps([{ 'id': str(v['id']), 'name': v['name'], 'skills': v['skills'], 'location': v['location'] } for v in available_vols])}
    
    Return ONLY a JSON array: [{{"id": "uuid", "score": 0-100, "reason": "why"}}]
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        rankings = json.loads(text)
        
        for rank in rankings:
            # Save to SQL Cache
            supabase.table("ai_recommendations").upsert({
                "issue_id": issue_id,
                "volunteer_id": rank['id'],
                "match_score": rank['score'],
                "reasoning": rank['reason']
            }).execute()
        
        return rankings
    except Exception as e:
        print(f"Immediate Batch Match Error: {e}")
        return []

@app.post("/report")
async def submit_report(report: ReportRequest):
    """Ingest raw report and process via Gemini AI."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    # 1. Save raw report
    raw_res = supabase.table("raw_reports").insert({"content": report.content}).execute()
    raw_id = raw_res.data[0]['id']
    
    # 2. Process with AI
    try:
        structured_data = process_report_with_gemini(report.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not structured_data:
        raise HTTPException(status_code=500, detail="Failed to process report via AI")
        
    # 3. Save structured issue
    issue_res = supabase.table("issues").insert({
        "issue_type": structured_data.get("issue_type", "Unknown"),
        "severity": structured_data.get("severity", 1),
        "urgency": structured_data.get("urgency", "medium").lower(),
        "location": structured_data.get("location", "Unknown"),
        "people_affected": structured_data.get("people_affected", 0),
        "summary": structured_data.get("summary", ""),
        "recommended_procedure": structured_data.get("recommended_procedure", "")
    }).execute()
    
    issue_id = issue_res.data[0]['id']
    issue_data = issue_res.data[0]
    
    # 3.5 Run AI Matching and Impact Prediction immediately
    print(f"DEBUG: Triggering AI Match for new issue {issue_id}")
    run_ai_matching(issue_id, issue_data)
    
    impact = predict_impact_with_gemini(
        issue_data["issue_type"], 
        issue_data["severity"], 
        issue_data["people_affected"]
    )
    if impact:
        supabase.table("issues").update({"impact_prediction": impact}).eq("id", issue_id).execute()
    
    # 4. Mark raw report as processed
    supabase.table("raw_reports").update({
        "processed": True, 
        "issue_id": issue_id
    }).eq("id", raw_id).execute()
    
    return {"message": "Report processed successfully", "issue": issue_res.data[0]}

@app.get("/issues")
async def get_issues():
    """Retrieve recent issues."""
    if not supabase:
        return []
    res = supabase.table("issues").select("*").order("created_at", desc=True).limit(50).execute()
    return res.data

@app.get("/alerts")
async def get_crisis_alerts():
    """Detect crisis spikes using simple anomaly detection over 7 days."""
    if not supabase:
        return []
        
    # Fetch last 7 days of data
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    res = supabase.table("issues").select("*").gte("created_at", seven_days_ago).execute()
    issues = res.data
    
    groups = {}
    for issue in issues:
        key = f"{issue['issue_type']}_{issue['location']}"
        if key not in groups:
            groups[key] = {
                "current_24h": 0, 
                "past_6d": 0, 
                "issue_type": issue['issue_type'], 
                "location": issue['location']
            }
            
        # Supabase returns UTC ISO strings
        created_at_str = issue['created_at'].replace('Z', '+00:00')
        created_at = datetime.fromisoformat(created_at_str)
        
        if (datetime.now(created_at.tzinfo) - created_at).days < 1:
            groups[key]["current_24h"] += 1
        else:
            groups[key]["past_6d"] += 1
            
    alerts = []
    for key, stats in groups.items():
        baseline_daily_avg = stats["past_6d"] / 6.0
        # Formula: current_count / (baseline + 1)
        spike_score = stats["current_24h"] / (baseline_daily_avg + 1)
        
        # Trigger alert if score > 2 and at least 3 occurrences
        if spike_score > 2 and stats["current_24h"] >= 3:
            alerts.append({
                "issue_type": stats["issue_type"],
                "location": stats["location"],
                "spike_score": round(spike_score, 2),
                "current_count": stats["current_24h"],
                "baseline_avg": round(baseline_daily_avg, 2)
            })
            
    return sorted(alerts, key=lambda x: x["spike_score"], reverse=True)

@app.post("/auth/signup")
async def signup(req: SignupRequest):
    """Sign up a new volunteer and create their profile."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # 1. Create Supabase Auth User
        auth_res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        # 2. Create Volunteer Profile
        profile_res = supabase.table("volunteers").insert({
            "id": auth_res.user.id,
            "name": req.name,
            "location": req.location,
            "skills": req.skills,
            "phone_number": req.phone_number,
            "ngo_member": req.ngo_member,
            "ngo_name": req.ngo_name if req.ngo_member else None,
            "ngo_role": req.ngo_role if req.ngo_member else None,
            "ngo_website": req.ngo_website if req.ngo_member else None
        }).execute()
        
        return {"message": "User created", "user": auth_res.user, "profile": profile_res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(req: LoginRequest):
    """Authenticate volunteer and return session."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    """Fetch current logged-in volunteer profile."""
    res = supabase.table("volunteers").select("*").eq("id", user.id).single().execute()
    return res.data

@app.put("/auth/me")
async def update_me(req: ProfileUpdate, user = Depends(get_current_user)):
    """Update current logged-in volunteer profile."""
    try:
        print(f"DEBUG: Updating profile for user {user.id} with data: {req.dict()}")
        res = supabase.table("volunteers").update({
            "name": req.name,
            "location": req.location,
            "skills": req.skills,
            "availability": req.availability,
            "avatar_url": req.avatar_url,
            "phone_number": req.phone_number,
            "ngo_member": req.ngo_member,
            "ngo_name": req.ngo_name if req.ngo_member else None,
            "ngo_role": req.ngo_role if req.ngo_member else None,
            "ngo_website": req.ngo_website if req.ngo_member else None
        }).eq("id", user.id).execute()
        
        if not res.data:
            print("DEBUG: No record updated (user might not exist in volunteers table)")
            raise HTTPException(status_code=404, detail="Volunteer record not found")
            
        return res.data[0]
    except Exception as e:
        print(f"ERROR: Profile Update Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/volunteers")
async def get_all_volunteers(limit: int = 20, offset: int = 0):
    """Retrieve registered volunteers with pagination."""
    if not supabase:
        return []
    res = supabase.table("volunteers").select("*").order("name").range(offset, offset + limit - 1).execute()
    return res.data

@app.get("/volunteers/{volunteer_id}")
async def get_volunteer_details(volunteer_id: str):
    """Retrieve profile and active assignments for a specific volunteer."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get profile
    prof_res = supabase.table("volunteers").select("*").eq("id", volunteer_id).single().execute()
    if not prof_res.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")
        
    # Get active missions
    assign_res = supabase.table("assignments").select("*, issues(*)").eq("volunteer_id", volunteer_id).execute()
    
    # Get team (only approved ones)
    team_res = supabase.table("team_members").select("*, team:teams(*)").eq("volunteer_id", volunteer_id).eq("is_approved", True).execute()
    team = team_res.data[0]['team'] if team_res.data and team_res.data[0].get('team') else None
    
    return {
        "profile": prof_res.data,
        "assignments": assign_res.data,
        "team": team
    }

@app.post("/volunteer")
async def register_volunteer(vol: VolunteerRequest):
    """Register a new volunteer (Legacy/Internal use)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    res = supabase.table("volunteers").insert({
        "name": vol.name,
        "skills": vol.skills,
        "location": vol.location
    }).execute()
    
    return {"message": "Volunteer registered", "volunteer": res.data[0]}

@app.get("/match/{issue_id}")
async def match_volunteers(issue_id: int, user = Depends(get_current_user)):
    """Intelligently match volunteers to a specific issue."""
    if not supabase:
        return []
        
    # Get issue details
    issue_res = supabase.table("issues").select("*").eq("id", issue_id).execute()
    if not issue_res.data:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue = issue_res.data[0]
    
    # Lazy-load AI Prediction: Check database first
    impact = issue.get("impact_prediction")
    
    if not impact:
        print(f"Generating new AI prediction for issue {issue_id}...")
        impact = predict_impact_with_gemini(
            issue["issue_type"], 
            issue["severity"], 
            issue["people_affected"]
        )
        # Save to database for next time
        supabase.table("issues").update({"impact_prediction": impact}).eq("id", issue_id).execute()
    else:
        print(f"Using cached AI prediction for issue {issue_id}")
    
    # 1. Fetch volunteers already assigned to this issue
    assigned_res = supabase.table("assignments").select("*, volunteers(*)").eq("issue_id", issue_id).execute()
    joined_volunteers = [a['volunteers'] for a in assigned_res.data if a.get('volunteers')]
    joined_ids = [str(v['id']) for v in joined_volunteers]

    # 2. Check for cached AI recommendations
    cache_res = supabase.table("ai_recommendations").select("*, volunteers(*)").eq("issue_id", issue_id).execute()
    
    if cache_res.data and len(cache_res.data) > 0:
        print(f"DEBUG: Using cached AI matches for issue {issue_id}")
        scored_vols = []
        for rec in cache_res.data:
            vol = rec.get('volunteers')
            # LIVE CHECK: Only show if they are STILL on duty, NGO-verified, and haven't joined yet
            if vol and vol.get('availability') == True and is_ngo_verified(vol) and str(vol['id']) not in joined_ids:
                vol['match_score'] = rec['match_score']
                vol['reasoning'] = rec['reasoning']
                scored_vols.append(vol)
        
        return {
            "issue": issue,
            "impact_prediction": impact or {},
            "joined_volunteers": joined_volunteers,
            "best_matches": sorted(scored_vols, key=lambda x: x.get('match_score', 0), reverse=True)[:5]
        }

    # 3. No cache? Do Batch AI Matching
    print(f"DEBUG: Generating BATCH AI matches for issue {issue_id}")
    vols_res = supabase.table("volunteers").select("*").eq("availability", True).execute()
    # Only NGO-verified volunteers are eligible for AI recommendations
    available_vols = [v for v in vols_res.data if str(v['id']) not in joined_ids and is_ngo_verified(v)]

    if not available_vols:
        return {
            "issue": issue,
            "impact_prediction": impact or {},
            "joined_volunteers": joined_volunteers,
            "best_matches": []
        }

    prompt = f"""
    Rank these {len(available_vols)} volunteers for this crisis.
    CRISIS: {issue['issue_type']} at {issue['location']} (Severity: {issue['severity']})
    VOLUNTEERS: {json.dumps([{ 'id': str(v['id']), 'name': v['name'], 'skills': v['skills'], 'location': v['location'] } for v in available_vols])}
    
    Return ONLY a JSON array: [{{"id": "uuid", "score": 0-100, "reason": "why"}}]
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        rankings = json.loads(text)
        
        scored_vols = []
        for rank in rankings:
            vol = next((v for v in available_vols if str(v['id']) == str(rank['id'])), None)
            if vol:
                # Save to SQL Cache
                supabase.table("ai_recommendations").upsert({
                    "issue_id": issue_id,
                    "volunteer_id": vol['id'],
                    "match_score": rank['score'],
                    "reasoning": rank['reason']
                }).execute()
                
                vol['match_score'] = rank['score']
                vol['reasoning'] = rank['reason']
                scored_vols.append(vol)
        
        return {
            "issue": issue,
            "impact_prediction": impact or {},
            "joined_volunteers": joined_volunteers,
            "best_matches": sorted(scored_vols, key=lambda x: x.get('match_score', 0), reverse=True)[:5]
        }
    except Exception as e:
        print(f"Batch Match Error: {e}")
        return {
            "issue": issue,
            "impact_prediction": impact or {},
            "joined_volunteers": joined_volunteers,
            "best_matches": []
        }

@app.post("/assignments")
async def create_assignment(req: AssignmentRequest, user = Depends(get_current_user)):
    """Assign the current user to an issue."""
    # Check if already assigned
    existing = supabase.table("assignments").select("*").eq("volunteer_id", user.id).eq("issue_id", req.issue_id).execute()
    if existing.data:
        return {"message": "Already assigned", "assignment": existing.data[0]}
        
    res = supabase.table("assignments").insert({
        "volunteer_id": user.id,
        "issue_id": req.issue_id,
        "status": "assigned"
    }).execute()
    
    return {"message": "Assigned successfully", "assignment": res.data[0]}

@app.post("/issues/{issue_id}/resolve")
async def resolve_issue(issue_id: int, user = Depends(get_current_user)):
    """Mark an issue as resolved (only by signed-in volunteers)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    res = supabase.table("issues").update({"is_resolved": True}).eq("id", issue_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    return {"message": "Issue resolved successfully", "issue": res.data[0]}

@app.get("/inbox")
async def get_volunteer_inbox(user = Depends(get_current_user)):
    """Personalized inbox for volunteers based on location and skills."""
    if not supabase:
        return []
        
    # 1. Get Volunteer Info
    vol_res = supabase.table("volunteers").select("*").eq("id", user.id).single().execute()
    if not vol_res.data:
        raise HTTPException(status_code=404, detail="Volunteer profile not found")
    volunteer = vol_res.data
    
    # 2. Get All Open Issues
    issues_res = supabase.table("issues").select("*").eq("is_resolved", False).order("created_at", desc=True).limit(50).execute()
    issues = issues_res.data
    
    # 3. Get existing assignments (to exclude)
    assign_res = supabase.table("assignments").select("issue_id").eq("volunteer_id", user.id).execute()
    assigned_ids = [a['issue_id'] for a in assign_res.data]
    
    inbox_items = []
    
    vol_loc = (volunteer.get('location') or "").lower()
    vol_skills = [s.lower() for s in (volunteer.get('skills') or [])]
    
    for issue in issues:
        if issue['id'] in assigned_ids:
            continue
            
        score = 0
        match_reasons = []
        
        # A. Location Match
        iss_loc = (issue.get('location') or "").lower()
        if vol_loc and (vol_loc in iss_loc or iss_loc in vol_loc):
            score += 50
            match_reasons.append("Nearby Location")
            
        # B. Skill Match
        iss_type = (issue.get('issue_type') or "").lower()
        iss_summary = (issue.get('summary') or "").lower()
        for skill in vol_skills:
            if skill in iss_type or skill in iss_summary:
                score += 30
                match_reasons.append(f"Skill Match: {skill}")
                break
                
        # C. Severity Bonus
        score += (issue.get('severity', 1) * 5)
        
        # ADDED: Always show all unassigned issues, just rank them
        inbox_items.append({
            "id": issue['id'],
            "issue_type": issue['issue_type'],
            "location": issue['location'],
            "severity": issue['severity'],
            "urgency": issue['urgency'],
            "summary": issue['summary'],
            "recommended_procedure": issue.get('recommended_procedure', ''),
            "match_score": score,
            "reasons": match_reasons if match_reasons else ["General Assistance"]
        })
            
    # Sort by highest score
    inbox_items.sort(key=lambda x: x['match_score'], reverse=True)
    
    return inbox_items

@app.get("/assignments/me")
async def get_my_assignments(user = Depends(get_current_user)):
    """Get all assignments for the current volunteer."""
    if not supabase:
        return []
    res = supabase.table("assignments").select("*, issues(*)").eq("volunteer_id", user.id).execute()
    return res.data

@app.post("/teams")
async def create_team(team: TeamCreate, user = Depends(get_current_user)):
    """Create a new team."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Insert team
    res = supabase.table("teams").insert({
        "name": team.name,
        "description": team.description,
        "image_url": team.image_url,
        "leader_id": user.id
    }).execute()
    
    team_data = res.data[0]
    
    # Add leader to team members
    supabase.table("team_members").insert({
        "team_id": team_data['id'],
        "volunteer_id": user.id,
        "is_approved": True
    }).execute()
    
    return {"message": "Team created successfully", "team": team_data}

@app.get("/teams")
async def get_teams():
    """Get all teams with their members count and leader info."""
    if not supabase:
        return []
        
    res = supabase.table("teams").select("*, leader:volunteers!teams_leader_id_fkey(name, avatar_url), members:team_members(count)").order("created_at", desc=True).execute()
    return res.data

@app.get("/teams/{team_id}")
async def get_team_details(team_id: int):
    """Get details of a specific team including its members."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    team_res = supabase.table("teams").select("*, leader:volunteers!teams_leader_id_fkey(*)").eq("id", team_id).single().execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    members_res = supabase.table("team_members").select("*, volunteer:volunteers(*)").eq("team_id", team_id).eq("is_approved", True).execute()
    
    return {
        "team": team_res.data,
        "members": [m['volunteer'] for m in members_res.data if m.get('volunteer')]
    }

@app.post("/teams/join")
async def join_team(req: TeamJoin, user = Depends(get_current_user)):
    """Join a team."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    # Check if user is already in ANY team (approved or pending)
    # Since denying deletes the row, any existing row means they are in a team or pending.
    any_team_res = supabase.table("team_members").select("id").eq("volunteer_id", user.id).execute()
    if any_team_res.data:
        raise HTTPException(status_code=400, detail="You can only be in one team at a time or have one pending request.")
        
    # Check if team exists
    team_res = supabase.table("teams").select("id").eq("id", req.team_id).execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    res = supabase.table("team_members").insert({
        "team_id": req.team_id,
        "volunteer_id": user.id,
        "is_approved": False
    }).execute()
    
    return {"message": "Join request sent", "member": res.data[0]}

@app.get("/users/me/teams")
async def get_my_teams(user = Depends(get_current_user)):
    """Get teams the current user is a member of or requested to join."""
    if not supabase:
        return []
        
    res = supabase.table("team_members").select("*, team:teams(*)").eq("volunteer_id", user.id).execute()
    # We can return the status along with the team
    teams_with_status = []
    for m in res.data:
        if m.get('team'):
            team = m['team']
            team['is_approved'] = m['is_approved']
            teams_with_status.append(team)
    return teams_with_status

class TeamRequestResponse(BaseModel):
    approved: bool

@app.get("/teams/requests/pending")
async def get_team_requests(user = Depends(get_current_user)):
    """Get pending join requests for teams the user leads."""
    if not supabase:
        return []
        
    # 1. Get teams user leads
    teams_res = supabase.table("teams").select("id, name").eq("leader_id", user.id).execute()
    if not teams_res.data:
        return []
        
    team_ids = [t['id'] for t in teams_res.data]
    team_names = {t['id']: t['name'] for t in teams_res.data}
    
    # 2. Get pending requests for those teams
    reqs_res = supabase.table("team_members").select("*, volunteer:volunteers(*)").in_("team_id", team_ids).eq("is_approved", False).execute()
    
    requests = []
    for r in reqs_res.data:
        requests.append({
            "id": r["id"],
            "team_id": r["team_id"],
            "team_name": team_names.get(r["team_id"]),
            "volunteer": r["volunteer"],
            "joined_at": r["joined_at"]
        })
        
    return requests

@app.post("/teams/requests/{request_id}/respond")
async def respond_to_team_request(request_id: int, resp: TeamRequestResponse, user = Depends(get_current_user)):
    """Approve or deny a team join request."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    # Check if user leads the team for this request
    req_res = supabase.table("team_members").select("*, teams(*)").eq("id", request_id).single().execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req_res.data['teams']['leader_id'] != user.id:
        raise HTTPException(status_code=403, detail="You are not the leader of this team")
        
    # Update status or delete if rejected
    if resp.approved:
        res = supabase.table("team_members").update({"is_approved": True}).eq("id", request_id).execute()
        return {"message": "Request approved"}
    else:
        res = supabase.table("team_members").delete().eq("id", request_id).execute()
        return {"message": "Request denied"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
