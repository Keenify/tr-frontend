import { useState, useEffect, useCallback } from 'react';
import { jdService } from '../services/jdService';
import { JDPage, UpdateJDPageRequest } from '../types/jd.types';

export const useJDPages = (companyId?: string) => {
  const [pages, setPages] = useState<JDPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jdService.fetchJDPages(companyId);
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch JD page');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

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
      await jdService.initializeDefaultPage(companyId);
      await fetchPages(); // Refresh the pages
    } catch (err) {
      console.log('Could not initialize default page:', err);
    }
  }, [fetchPages, companyId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Auto-initialize default page if no pages exist, but only after initial load is complete
  useEffect(() => {
    if (pages.length === 0 && !loading && !error) {
      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        initializeDefaultPage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pages.length, loading, error, initializeDefaultPage]);

  return {
    pages,
    loading,
    error,
    fetchPages,
    updatePage,
    initializeDefaultPage,
  };
};
