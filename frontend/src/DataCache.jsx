import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DataCacheContext = createContext(null);

export function useDataCache() {
  return useContext(DataCacheContext);
}

export function DataCacheProvider({ children, session }) {
  // Public data (no auth required)
  const [issues, setIssues] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [teams, setTeams] = useState([]);

  // Authenticated data
  const [inbox, setInbox] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);

  // Loading states
  const [publicLoading, setPublicLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Track whether initial load is done
  const publicFetched = useRef(false);
  const authFetched = useRef(false);

  const getToken = useCallback(() => {
    return localStorage.getItem('rs_token');
  }, []);

  const authHeaders = useCallback(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  // ── Public data fetchers ──
  const refreshIssues = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/issues`);
      setIssues(res.data || []);
    } catch (e) { console.error('Cache: issues fetch failed', e); }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/alerts`);
      setAlerts(res.data || []);
    } catch (e) { console.error('Cache: alerts fetch failed', e); }
  }, []);

  const refreshVolunteers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/volunteers?limit=100&offset=0`);
      setVolunteers(res.data || []);
    } catch (e) { console.error('Cache: volunteers fetch failed', e); }
  }, []);

  const refreshTeams = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/teams`);
      setTeams(res.data || []);
    } catch (e) { console.error('Cache: teams fetch failed', e); }
  }, []);

  // ── Authenticated data fetchers ──
  const refreshInbox = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/inbox`, { headers: { Authorization: `Bearer ${token}` } });
      setInbox(res.data || []);
    } catch (e) { console.error('Cache: inbox fetch failed', e); }
  }, [getToken]);

  const refreshMyAssignments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/assignments/me`, { headers: { Authorization: `Bearer ${token}` } });
      setMyAssignments(res.data || []);
    } catch (e) { console.error('Cache: assignments fetch failed', e); }
  }, [getToken]);

  const refreshMyTeams = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/users/me/teams`, { headers: { Authorization: `Bearer ${token}` } });
      setMyTeams(res.data || []);
    } catch (e) { console.error('Cache: my teams fetch failed', e); }
  }, [getToken]);

  const refreshTeamRequests = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/teams/requests/pending`, { headers: { Authorization: `Bearer ${token}` } });
      setTeamRequests(res.data || []);
    } catch (e) { console.error('Cache: team requests fetch failed', e); }
  }, [getToken]);

  // ── Bulk refresh helpers ──
  const refreshAllPublic = useCallback(async () => {
    await Promise.all([refreshIssues(), refreshAlerts(), refreshVolunteers(), refreshTeams()]);
  }, [refreshIssues, refreshAlerts, refreshVolunteers, refreshTeams]);

  const refreshAllAuth = useCallback(async () => {
    await Promise.all([refreshInbox(), refreshMyAssignments(), refreshMyTeams(), refreshTeamRequests()]);
  }, [refreshInbox, refreshMyAssignments, refreshMyTeams, refreshTeamRequests]);

  // ── Initial public data fetch (runs once) ──
  useEffect(() => {
    if (publicFetched.current) return;
    publicFetched.current = true;

    const load = async () => {
      setPublicLoading(true);
      await refreshAllPublic();
      setPublicLoading(false);
    };
    load();
  }, [refreshAllPublic]);

  // ── Authenticated data fetch (runs when session changes) ──
  useEffect(() => {
    if (!session) {
      // Clear auth data on logout
      setInbox([]);
      setMyAssignments([]);
      setMyTeams([]);
      setTeamRequests([]);
      setAuthLoading(false);
      authFetched.current = false;
      return;
    }

    if (authFetched.current) return;
    authFetched.current = true;

    const load = async () => {
      setAuthLoading(true);
      await refreshAllAuth();
      setAuthLoading(false);
    };
    load();
  }, [session, refreshAllAuth]);

  const value = {
    // Data
    issues,
    alerts,
    volunteers,
    teams,
    inbox,
    myAssignments,
    myTeams,
    teamRequests,

    // Loading
    publicLoading,
    authLoading,

    // Setters (for local optimistic updates)
    setIssues,
    setInbox,
    setMyAssignments,
    setMyTeams,
    setTeamRequests,
    setVolunteers,
    setTeams,

    // Refresh functions (for targeted re-fetches after mutations)
    refreshIssues,
    refreshAlerts,
    refreshVolunteers,
    refreshTeams,
    refreshInbox,
    refreshMyAssignments,
    refreshMyTeams,
    refreshTeamRequests,
    refreshAllPublic,
    refreshAllAuth,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}
