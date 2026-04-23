import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, UserCheck, Zap, Activity, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function VolunteerMatching() {
  const [searchParams] = useSearchParams();
  const issueId = searchParams.get('issue');
  
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(issueId || '');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    // Fetch issues for dropdown
    axios.get(`${API_URL}/issues`).then(res => setIssues(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedIssue) {
      fetchMatches(selectedIssue);
    }
  }, [selectedIssue]);

  const fetchMatches = async (id) => {
    setLoading(true);
    setMatchData(null);
    try {
      const token = localStorage.getItem('rs_token');
      const res = await axios.get(`${API_URL}/match/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchData(res.data);
      
      // Check if user is already assigned
      const assignments = await axios.get(`${API_URL}/assignments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAssigned(assignments.data.some(a => a.issue_id === parseInt(id)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleJoinEffort = async () => {
    setJoining(true);
    try {
      const token = localStorage.getItem('rs_token');
      await axios.post(`${API_URL}/assignments`, 
        { issue_id: parseInt(selectedIssue) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAssigned(true);
      fetchMatches(selectedIssue);
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  // Check if Gemini is unavailable
  const isAiUnavailable = matchData?.impact_prediction?.impact_level === 'unknown' || 
                         matchData?.impact_prediction?.short_term_consequences?.[0]?.includes('unavailable');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Volunteer Matching & Impact</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>AI-driven dispatch and coordination system</p>
        </div>
        
        <select 
          className="form-control" 
          style={{ width: '300px' }}
          value={selectedIssue}
          onChange={(e) => setSelectedIssue(e.target.value)}
        >
          <option value="">-- Select an Issue --</option>
          {issues.map(iss => (
            <option key={iss.id} value={iss.id}>{iss.issue_type} in {iss.location}</option>
          ))}
        </select>
      </div>

      {isAiUnavailable && (
        <div className="card" style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle color="var(--danger)" />
          <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
            <strong>AI Service Busy:</strong> Impact predictions are currently unavailable due to high demand. Standard protocols are active.
          </div>
        </div>
      )}

      {!selectedIssue && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <UserCheck size={48} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h3>Select an issue to find matches</h3>
          <p style={{ color: 'var(--text-light)' }}>
            Our AI will predict the impact and find the best skilled volunteers nearby.
          </p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
        </div>
      )}

      {!loading && selectedIssue && !matchData && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--danger)' }}>
          <p style={{ color: 'var(--danger)' }}>Failed to load match data. Please ensure you are logged in correctly.</p>
          <button className="btn btn-primary" onClick={() => fetchMatches(selectedIssue)}>Retry</button>
        </div>
      )}

      {!loading && matchData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Action Card */}
          <div className="card" style={{ background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Respond to {matchData.issue?.issue_type}</h3>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{matchData.issue?.location} • Severity {matchData.issue?.severity}/5</p>
            </div>
            {isAssigned ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>
                <UserCheck size={20} /> You are signed up!
              </div>
            ) : (
              <button 
                className="btn" 
                onClick={handleJoinEffort}
                disabled={joining}
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }}
              >
                {joining ? 'Joining...' : 'I want to help'}
              </button>
            )}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            {/* AI Impact Prediction */}
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="var(--primary)" /> AI Prediction
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <div className="form-label">Predicted Level</div>
                  <span className={`badge`} style={{ background: isAiUnavailable ? 'var(--border)' : 'var(--danger)', color: isAiUnavailable ? 'var(--text)' : 'white' }}>
                    {isAiUnavailable ? 'UNAVAILABLE' : matchData.impact_prediction.impact_level?.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <div className="form-label">Consequences</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {(matchData.impact_prediction.short_term_consequences || []).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <div className="form-label">Recommended Action</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                    {matchData.impact_prediction.recommended_action}
                  </p>
                </div>
              </div>
            </div>

            {/* Volunteer Matches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Active Team */}
              {matchData.joined_volunteers?.length > 0 && (
                <div className="card" style={{ background: 'rgba(46, 204, 113, 0.05)', border: '1px solid var(--success)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Active Response Team</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matchData.joined_volunteers.map(vol => (
                      <div key={vol.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {vol.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{vol.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{vol.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              <div className="card">
                <h3 style={{ margin: '0 0 1.5rem 0' }}>AI-Recommended Volunteers</h3>
                {matchData.best_matches?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matchData.best_matches.map(vol => (
                      <div key={vol.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.5)' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{vol.name}</h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={14} /> {vol.location}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Activity size={14} /> Match: {vol.match_score}%
                            </span>
                          </div>
                        </div>
                        <button className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--border)' }}>Details</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-light)' }}>No other matching volunteers found nearby.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
