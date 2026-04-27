import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, MapPin, ChevronRight, Search, Loader2 } from 'lucide-react';
import { useDataCache } from '../DataCache';

export default function VolunteersList() {
  const { volunteers, publicLoading, refreshVolunteers } = useDataCache();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter from the cached set for instant search feel
  const filteredVols = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (publicLoading) return <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius)' }}></div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-responsive" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Volunteer Force</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>Search through our network of {volunteers.length}+ responders</p>
        </div>
        
        <div className="search-container" style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            className="form-control"
            style={{ paddingLeft: '2.5rem', borderRadius: '2rem' }}
            placeholder="Search volunteers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredVols.map(vol => (
          <NavLink key={vol.id} to={`/volunteers/${vol.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card hover-card list-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem', 
              padding: '1rem 1.5rem',
              transition: '0.2s',
              border: '1px solid var(--border)'
            }}>
              {/* Avatar Image or Initial */}
              {vol.avatar_url ? (
                <img 
                  src={vol.avatar_url} 
                  alt={vol.name} 
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                  {vol.name[0].toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{vol.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                  <MapPin size={14} /> {vol.location}
                </div>
              </div>

              <div className="desktop-only" style={{ flex: 1, gap: '0.5rem', flexWrap: 'wrap' }}>
                {(vol.skills || []).slice(0, 2).map((s, i) => (
                  <span key={i} className="badge" style={{ fontSize: '0.7rem', background: 'var(--border)', color: 'var(--text)' }}>{s}</span>
                ))}
              </div>

              <div style={{ textAlign: 'right', minWidth: '80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: vol.availability ? 'var(--success)' : 'var(--text-light)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: vol.availability ? 'var(--success)' : '#bdc3c7' }} className="hide-on-mobile" />
                  {vol.availability ? 'Active' : 'Off Duty'}
                </div>
              </div>

              <ChevronRight size={20} color="var(--text-light)" />
            </div>
          </NavLink>
        ))}
      </div>

      {filteredVols.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-light)' }}>No volunteers found matching your search.</p>
        </div>
      )}
    </div>
  );
}
