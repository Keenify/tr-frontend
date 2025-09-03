import { useState, useEffect, useCallback } from 'react';
import { jdService } from '../services/jdService';
import { JDPage, UpdateJDPageRequest } from '../types/jd.types';

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
      setError(err instanceof Error ? err.message : 'Failed to fetch JD page');
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

  // Initialize with a default page if none exists
  const initializeDefaultPage = useCallback(async () => {
    try {
      await jdService.initializeDefaultPage();
      await fetchPages(); // Refresh the pages
    } catch (err) {
      console.log('Could not initialize default page:', err);
    }
  }, [fetchPages]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Auto-initialize default page if no pages exist
  useEffect(() => {
    if (pages.length === 0 && !loading) {
      initializeDefaultPage();
    }
  }, [pages.length, loading, initializeDefaultPage]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    updatePage,
    initializeDefaultPage,
  };
};
