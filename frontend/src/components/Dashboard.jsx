import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Users, MapPin, Activity } from 'lucide-react';

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
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertTriangle /> Active Spikes Detected
          </h3>
          <div className="grid grid-cols-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="card alert-card">
                <div className="alert-title">
                  {alert.issue_type} in {alert.location}
                </div>
                <p>Spike Score: <strong>{alert.spike_score}x</strong> normal baseline.</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Current 24h count: {alert.current_count} (Avg: {alert.baseline_avg}/day)
                </p>
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
              <a href={`/volunteer?issue=${issue.id}`} className="btn btn-outline" style={{ width: '100%' }}>
                Find Volunteers
              </a>
            </div>
          </div>
        ))}
        {issues.length === 0 && <p>No issues reported yet.</p>}
      </div>
    </div>
  );
}
