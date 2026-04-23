import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, MapPin, ShieldAlert, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

export default function Inbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    const token = localStorage.getItem('rs_token');
    try {
      const res = await axios.get(`${API_URL}/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (issueId) => {
    const token = localStorage.getItem('rs_token');
    try {
      await axios.post(`${API_URL}/assignments`, 
        { issue_id: issueId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from inbox UI
      setItems(prev => prev.filter(item => item.id !== issueId));
      alert("Mission Accepted! It's now in your active cases.");
    } catch (err) {
      console.error(err);
      alert("Failed to accept mission.");
    }
  };

  if (loading) return <div className="skeleton" style={{ height: '400px' }}></div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Mail color="var(--primary)" /> Volunteer Inbox
        </h2>
        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
          Personalized mission opportunities based on your location and skills.
        </p>
      </div>

      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ borderLeft: `6px solid ${item.severity > 3 ? 'var(--danger)' : 'var(--primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{item.issue_type}</h3>
                    <span className="badge" style={{ 
                      background: item.severity > 3 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                      color: item.severity > 3 ? 'var(--danger)' : 'var(--primary)',
                      border: 'none'
                    }}>
                      Level {item.severity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    <MapPin size={14} /> {item.location}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Zap size={14} /> {item.match_score}% MATCH
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>{item.summary}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {item.reasons.map((reason, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '0.2rem 0.6rem', borderRadius: '1rem', color: 'var(--text-light)' }}>
                    {reason}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleAccept(item.id)}
                  className="btn btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <CheckCircle size={18} /> Accept Mission
                </button>
                <NavLink 
                  to={`/match/${item.id}`} 
                  className="btn" 
                  style={{ border: '1px solid var(--border)', background: 'white' }}
                >
                  View Details
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
          <h3>No New Matches</h3>
          <p style={{ color: 'var(--text-light)' }}>We couldn't find any unresolved reports matching your profile right now.</p>
        </div>
      )}
    </div>
  );
}
