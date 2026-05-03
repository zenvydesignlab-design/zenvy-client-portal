import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProjects } from '../services/api';
import { useAuth } from './useAuth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setProjects(await getProjects(user));
    } catch (err) {
      setError(err.message || 'Unable to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({ projects, loading, error, refresh }), [projects, loading, error, refresh]);
}
