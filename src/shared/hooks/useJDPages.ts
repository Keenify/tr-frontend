import { useState, useEffect, useCallback } from 'react';
import { jdService } from '../services/jdService';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest } from '../types/jd.types';

export const useJDPages = () => {
  const [pages, setPages] = useState<JDPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jdService.fetchJDPages();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch JD pages');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPage = useCallback(async (pageData: CreateJDPageRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newPage = await jdService.createJDPage(pageData);
      setPages(prev => [newPage, ...prev]);
      return newPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create JD page');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePage = useCallback(async (id: string, pageData: UpdateJDPageRequest) => {
    try {
      setLoading(true);
      setError(null);
      const updatedPage = await jdService.updateJDPage(id, pageData);
      setPages(prev => prev.map(page => 
        page.id === id ? updatedPage : page
      ));
      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update JD page');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePage = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await jdService.deleteJDPage(id);
      setPages(prev => prev.filter(page => page.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete JD page');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
  };
};
