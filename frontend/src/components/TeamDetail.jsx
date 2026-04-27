import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, ArrowLeft, Shield, MapPin, Loader, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

function TeamDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userTeams, setUserTeams] = useState([]);

  const token = localStorage.getItem('rs_token');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`${API_URL}/teams/${id}`);
        setTeamData(res.data);
        
        if (token) {
          const userRes = await axios.get(`${API_URL}/users/me/teams`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserTeams(userRes.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch team details", err);
        setError('Failed to load team details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id, token]);

  const handleJoinTeam = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setJoining(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/teams/join`, { team_id: parseInt(id) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'exists') {
        setError('You are already a member of this team.');
      } else {
        setSuccess('Successfully joined the team!');
        // Refresh team and user data
        const refreshRes = await axios.get(`${API_URL}/teams/${id}`);
        setTeamData(refreshRes.data);
        const userRes = await axios.get(`${API_URL}/users/me/teams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserTeams(userRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="skeleton" style={{ height: '300px' }}></div>;
  if (!teamData) return <div className="alert alert-danger">Team not found.</div>;

  const { team, members } = teamData;
  
  // Check if current user is already a member
  const isMember = user && members.some(m => m.id === user.id);
  const isLeader = user && team.leader_id === user.id;
  
  // Check if user has a pending request for THIS team
  const isPendingHere = userTeams.some(t => t.id === parseInt(id) && t.is_approved === false);
  // Check if user is in ANY other team or pending elsewhere
  const hasTeamConstraint = userTeams.length > 0;

  return (
    <div className="team-detail fade-in">
      <Link to="/teams" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Teams
      </Link>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
        {team.image_url ? (
          <div style={{ width: '100%', height: '250px', background: `url(${team.image_url}) center/cover no-repeat` }} />
        ) : (
          <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, var(--primary) 0%, #2c3e50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Users size={64} style={{ opacity: 0.5 }} />
          </div>
        )}
        
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {team.name}
              </h1>
              <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', margin: '0 0 1.5rem 0', maxWidth: '800px' }}>
                {team.description || "No description provided."}
              </p>
            </div>
            
            <div>
              {!isMember && !isPendingHere && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleJoinTeam} 
                  disabled={joining || hasTeamConstraint}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '0.75rem 1.5rem', opacity: hasTeamConstraint ? 0.5 : 1, cursor: hasTeamConstraint ? 'not-allowed' : 'pointer' }}
                  title={hasTeamConstraint ? "You are already in a team or have a pending request." : ""}
                >
                  {joining ? <Loader className="spin" size={20} /> : <UserPlus size={20} />}
                  Join Team
                </button>
              )}
              {isPendingHere && (
                <span className="badge" style={{ background: 'rgba(241, 196, 15, 0.1)', color: 'var(--warning)', padding: '0.5rem 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader className="spin" size={18} /> Request Pending
                </span>
              )}
              {isMember && !isLeader && (
                <span className="badge" style={{ background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', padding: '0.5rem 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> Member
                </span>
              )}
              {isLeader && (
                <span className="badge" style={{ background: 'rgba(241, 196, 15, 0.1)', color: 'var(--warning)', padding: '0.5rem 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} /> Team Leader
                </span>
              )}
            </div>
          </div>
          
          <div className="meta-info" style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</span>
              <span style={{ fontWeight: 500 }}>{new Date(team.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</span>
              <span style={{ fontWeight: 500 }}>{members.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader</span>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} color="var(--warning)" /> {team.leader?.name || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Team Members ({members.length})</h3>
        <div className="grid">
          {members.map(member => (
            <div key={member.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-dark)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem' }}>
                  {member.name?.[0]?.toUpperCase() || 'V'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {member.name}
                  {member.id === team.leader_id && <Shield size={14} color="var(--warning)" title="Team Leader" />}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={12} /> {member.location || 'Unknown Location'}
                </div>
              </div>
              <Link to={`/volunteers/${member.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;
