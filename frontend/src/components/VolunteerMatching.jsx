import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import axios from 'axios';
import { MapPin, UserCheck, Zap, Activity, AlertCircle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function VolunteerMatching() {
  const { id } = useParams();
  
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMatches(id);
    }
  }, [id]);

  const fetchMatches = async (mid) => {
    setLoading(true);
    setMatchData(null);
    try {
      const token = localStorage.getItem('rs_token');
      const res = await axios.get(`${API_URL}/match/${mid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchData(res.data);
      
      // Check if user is already assigned
      const assignments = await axios.get(`${API_URL}/assignments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAssigned(assignments.data.some(a => a.issue_id === parseInt(mid)));
    } catch (error) {
      console.error("Fetch Matches Error:", error);
    }
    setLoading(false);
  };

  const handleJoinEffort = async () => {
    setJoining(true);
    try {
      const token = localStorage.getItem('rs_token');
      await axios.post(`${API_URL}/assignments`, 
        { issue_id: parseInt(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAssigned(true);
      fetchMatches(id);
    } catch (err) {
      console.error(err);
      alert("Error joining mission.");
    } finally {
      setJoining(false);
    }
  };

  const handleResolveIssue = async () => {
    if (!window.confirm("Are you sure you want to mark this issue as completely resolved?")) return;
    
    try {
      const token = localStorage.getItem('rs_token');
      await axios.post(`${API_URL}/issues/${id}/resolve`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Issue marked as resolved successfully!");
      fetchMatches(id);
    } catch (err) {
      console.error(err);
      alert("Error resolving mission. You must be signed in.");
    }
  };

  // Check if Gemini is unavailable
  const isAiUnavailable = matchData?.impact_prediction?.impact_level === 'unknown' || 
                         matchData?.impact_prediction?.short_term_consequences?.[0]?.includes('unavailable');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>
          <ArrowLeft size={18} /> Back to Command Center
        </NavLink>
        <h2 style={{ margin: 0 }}>Mission Dispatch Intelligence</h2>
        <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>AI-driven crisis analysis and responder coordination</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ height: '400px', width: '100%' }}></div>
        </div>
      )}

      {!loading && !matchData && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--danger)' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--danger)' }}>Intelligence Feed Unavailable</h3>
          <p style={{ color: 'var(--text-light)' }}>We couldn't retrieve the analysis for this mission. Standard protocols are advised.</p>
          <NavLink to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Return to Command Center</NavLink>
        </div>
      )}

      {!loading && matchData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Action Card */}
          <div className="card flex-responsive" style={{ background: 'var(--primary)', color: 'white', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>Respond to {matchData.issue?.issue_type}</h3>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{matchData.issue?.location} • Severity {matchData.issue?.severity}/5</p>
            </div>
            {matchData.issue?.is_resolved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>
                <UserCheck size={20} /> Mission Resolved
              </div>
            ) : isAssigned ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>
                  <UserCheck size={20} /> You are signed up!
                </div>
                <button 
                  className="btn" 
                  onClick={handleResolveIssue}
                  style={{ background: 'var(--success)', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.5)' }}
                >
                  Mark as Resolved
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn" 
                  onClick={handleJoinEffort}
                  disabled={joining}
                  style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }}
                >
                  {joining ? 'Joining...' : 'I want to help'}
                </button>
                <button 
                  className="btn" 
                  onClick={handleResolveIssue}
                  style={{ background: 'transparent', color: 'white', fontWeight: 600, border: '1px solid rgba(255,255,255,0.5)' }}
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
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

                {matchData.issue?.recommended_procedure && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className="form-label">Detailed Procedure</div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'pre-wrap', color: 'var(--text-light)' }}>
                      {matchData.issue.recommended_procedure}
                    </p>
                  </div>
                )}
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
                      <div key={vol.id} className="card-header" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
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
