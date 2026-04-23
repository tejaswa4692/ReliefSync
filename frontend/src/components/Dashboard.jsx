import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Users, MapPin, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/issues`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/alerts`).catch(() => ({ data: [] }))
      ]);
      
      setIssues(issuesRes.data || []);
      setAlerts(alertsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="grid grid-cols-1"><div className="card skeleton" style={{height: '200px'}}></div></div>;
  }

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: '2rem' }}>Crisis Command Center</h2>
      
      {alerts.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 2s infinite' }}></div>
            <h3 style={{ margin: 0, color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800 }}>AI EMERGENCY DETECTION</h3>
          </div>
          
          <div className="grid grid-cols-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="card" style={{ border: '2px solid var(--danger)', background: 'rgba(231, 76, 60, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                    {alert.issue_type} Alert: <span style={{ color: 'var(--danger)' }}>{alert.location}</span>
                  </div>
                  <div className="badge" style={{ background: 'var(--danger)', color: 'white', border: 'none' }}>
                    {alert.spike_score}x Activity Spike
                  </div>
                </div>
                
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                  Our AI detected an unusual surge of <strong>{alert.current_count}</strong> reports in this area. 
                  This is <strong>{alert.spike_score} times higher</strong> than the normal daily average of {alert.baseline_avg}.
                </p>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.05rem', textTransform: 'uppercase' }}>
                  STATUS: IMMEDIATE INVESTIGATION REQUIRED
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3>Recent Reports</h3>
      <div className="grid grid-cols-3">
        {issues.map((issue) => (
          <div key={issue.id} className="card">
            <div className="card-header">
              <h4 className="card-title">{issue.issue_type}</h4>
              <span className={`badge badge-${issue.urgency}`}>
                {issue.urgency} Priority
              </span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              {issue.summary}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--secondary)" /> {issue.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="var(--secondary)" /> {issue.people_affected} affected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="var(--secondary)" /> Severity: {issue.severity}/5
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <NavLink to={`/match/${issue.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                Analyze & Match Volunteers
              </NavLink>
            </div>
          </div>
        ))}
        {issues.length === 0 && <p>No issues reported yet.</p>}
      </div>
    </div>
  );
}
