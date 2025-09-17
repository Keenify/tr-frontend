import { supabase } from '../../lib/supabase';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest } from '../types/jd.types';

// Single JD page instance - only one page allowed
let singleJDPage: JDPage | null = null;

export const jdService = {
  /**
   * Fetches the single JD page for the current user's company
   */
  async fetchJDPages(): Promise<JDPage[]> {
    try {
      // Always try to fetch from database first to ensure fresh data
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('jd_pages')
          .select('*')
          .eq('is_active', true)
          .limit(1) // Only get one page
          .order('updated_at', { ascending: false })
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (data) {
          singleJDPage = data;
          return [data];
        }
      } catch (dbError) {
        console.log('Database not available, checking cached page');
        // Only use cached page if database is unavailable
        if (singleJDPage) {
          return [singleJDPage];
        }
      }

      // Return empty array if no page exists
      return [];
    } catch (error) {
      console.error('Error fetching JD pages:', error);
      throw error;
    }
  },

  /**
   * Fetches the single JD page by ID
   */
  async fetchJDPage(id: string): Promise<JDPage | null> {
    try {
      // Return the single page if it matches the ID
      if (singleJDPage && singleJDPage.id === id) {
        return singleJDPage;
      }
      
      // Try to fetch from database
      try {
        const { data, error } = await supabase
          .from('jd_pages')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
        if (data) {
          singleJDPage = data;
          return data;
        }
      } catch (dbError) {
        console.log('Database not available, using default page');
      }

      return null;
    } catch (error) {
      console.error('Error fetching JD page:', error);
      throw error;
    }
  },

  /**
   * Creates a new JD page (only if none exists)
   */
  async createJDPage(pageData: CreateJDPageRequest): Promise<JDPage> {
    try {
      // Check if a page already exists
      if (singleJDPage) {
        throw new Error('A JD page already exists. Only one page is allowed.');
      }

      // Try to create in database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('jd_pages')
          .insert({
            ...pageData,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        
        singleJDPage = data;
        return data;
      } catch (dbError) {
        console.log('Database not available, creating mock page');
      }

      // Create mock page if database is not available
      const mockPage: JDPage = {
        id: Date.now().toString(),
        title: pageData.title,
        content: pageData.content,
        created_by: 'mock-user-id',
        updated_by: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      singleJDPage = mockPage;
      return mockPage;
    } catch (error) {
      console.error('Error creating JD page:', error);
      throw error;
    }
  },

  /**
   * Updates the existing JD page
   */
  async updateJDPage(id: string, pageData: UpdateJDPageRequest): Promise<JDPage> {
    try {
      // Ensure we have a page to update
      if (!singleJDPage) {
        throw new Error('No JD page exists to update');
      }

      // Try to update in database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('jd_pages')
          .update({
            ...pageData,
            updated_by: user.id,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        singleJDPage = data;
        return data;
      } catch (dbError) {
        console.log('Database not available, updating mock page');
      }

      // Update mock page if database is not available
      const updatedPage = {
        ...singleJDPage,
        ...pageData,
        updated_at: new Date().toISOString()
      };
      
      singleJDPage = updatedPage;
      return updatedPage;
    } catch (error) {
      console.error('Error updating JD page:', error);
      throw error;
    }
  },

  /**
   * Deletes the JD page (not allowed - only one page should exist)
   */
  async deleteJDPage(id: string): Promise<void> {
    throw new Error('Deleting the JD page is not allowed. Only one page should exist.');
  },

  /**
   * Uploads an image and returns the URL
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // Try to upload to database storage
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('jd-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('jd-images')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      } catch (storageError) {
        console.log('Storage not available, using placeholder image');
      }

      // Return mock image URL if storage is not available
      return `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(file.name)}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Gets the single JD page instance
   */
  getSinglePage(): JDPage | null {
    return singleJDPage;
  },

  /**
   * Initializes the service with a default page if none exists
   */
  async initializeDefaultPage(): Promise<void> {
    if (!singleJDPage) {
      try {
        await this.createJDPage({
          title: 'Job Description',
          content: 'Welcome to your Job Description page. Click Edit to start customizing this content.'
        });
      } catch (error) {
        console.log('Default page already exists or could not be created');
      }
    }
  },

  /**
   * Clears the cached page data - useful for debugging or forcing fresh data
   */
  clearCache(): void {
    singleJDPage = null;
  },

  /**
   * Forces a fresh fetch from the database, bypassing cache
   */
  async forceRefresh(): Promise<JDPage[]> {
    singleJDPage = null;
    return this.fetchJDPages();
  }
};
