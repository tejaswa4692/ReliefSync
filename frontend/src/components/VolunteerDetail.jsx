import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Tag, Activity, ArrowLeft, Mail, ShieldCheck, Users, Phone } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function VolunteerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/volunteers/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="skeleton" style={{ height: '500px' }}></div>;
  if (!data) return <div className="card">Volunteer not found</div>;

  const { profile, assignments, team } = data;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <NavLink to="/volunteer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--primary)', marginBottom: '2rem', fontWeight: 600 }}>
        <ArrowLeft size={18} /> Back to Directory
      </NavLink>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        {/* Left Column: Profile Card */}
        <div>
          <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.name} 
                style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--primary)', objectFit: 'cover', margin: '0 auto 1.5rem auto' }}
              />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', margin: '0 auto 1.5rem auto' }}>
                {profile.name[0].toUpperCase()}
              </div>
            )}
            
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{profile.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <MapPin size={16} /> {profile.location}
            </div>

            {profile.phone_number && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <Phone size={16} /> <a href={`tel:${profile.phone_number}`} style={{ color: 'inherit', textDecoration: 'none' }}>{profile.phone_number}</a>
              </div>
            )}

            {!profile.phone_number && (
              <div style={{ marginBottom: '1.5rem' }}></div>
            )}

            <div style={{ padding: '0.75rem', background: profile.availability ? 'rgba(46, 204, 113, 0.1)' : 'var(--border)', borderRadius: 'var(--radius)', color: profile.availability ? 'var(--success)' : 'var(--text-light)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: profile.availability ? 'var(--success)' : 'var(--border)' }} />
              {profile.availability ? 'ACTIVE DUTY' : 'OFF DUTY'}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05rem' }}>SKILLS & EXPERTISE</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(profile.skills || []).map((skill, i) => (
                  <span key={i} className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {team && (
              <div style={{ marginTop: '2rem', textAlign: 'left', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} /> CURRENT TEAM
                </h4>
                <NavLink to={`/teams/${team.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                  {team.image_url ? (
                    <img src={team.image_url} alt={team.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={18} color="white" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{team.name}</div>
                    {team.leader_id === profile.id && <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>Team Leader</div>}
                  </div>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mission History */}
        <div>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Activity size={22} color="var(--primary)" /> Active & Past Missions
            </h3>
            
            {assignments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignments.map(a => (
                  <div key={a.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.5)' }}>
                  <div className="card-header" style={{ marginBottom: 0, padding: 0, border: 'none' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{a.issues?.issue_type}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={14} /> {a.issues?.location}
                        </div>
                      </div>
                      <span className="badge" style={{ background: 'var(--success)', color: 'white' }}>
                        {a.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                <ShieldCheck size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>No mission records found for this volunteer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
