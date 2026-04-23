import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { Users, MapPin, ChevronRight, Search, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';
const PAGE_SIZE = 20;

export default function VolunteersList() {
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    fetchVolunteers(0, true);
  }, []);

  const fetchVolunteers = async (currentOffset, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(`${API_URL}/volunteers?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const newData = res.data || [];
      
      if (isInitial) {
        setVolunteers(newData);
      } else {
        setVolunteers(prev => [...prev, ...newData]);
      }
      
      setHasMore(newData.length === PAGE_SIZE);
      setOffset(currentOffset + PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchVolunteers(offset);
  };

  // Only filter from the loaded set for instant search feel
  const filteredVols = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius)' }}></div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Volunteer Force</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>Search through our network of {volunteers.length}+ responders</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
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

              <div style={{ display: 'none', flex: 1, gap: '0.5rem', flexWrap: 'wrap' }} className="desktop-only">
                {(vol.skills || []).slice(0, 2).map((s, i) => (
                  <span key={i} className="badge" style={{ fontSize: '0.7rem', background: 'var(--border)', color: 'var(--text)' }}>{s}</span>
                ))}
              </div>

              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: vol.availability ? 'var(--success)' : 'var(--text-light)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: vol.availability ? 'var(--success)' : '#bdc3c7' }} />
                  {vol.availability ? 'Active' : 'Off Duty'}
                </div>
              </div>

              <ChevronRight size={20} color="var(--text-light)" />
            </div>
          </NavLink>
        ))}
      </div>

      {hasMore && !searchTerm && (
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '3rem' }}>
          <button 
            onClick={handleLoadMore} 
            className="btn" 
            disabled={loadingMore}
            style={{ 
              background: 'white', 
              border: '1px solid var(--border)', 
              padding: '0.75rem 2rem', 
              borderRadius: '2rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loadingMore ? <Loader2 size={18} className="spin" /> : 'Load More Volunteers'}
          </button>
        </div>
      )}

      {filteredVols.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-light)' }}>No volunteers found matching your search.</p>
        </div>
      )}
    </div>
  );
}
