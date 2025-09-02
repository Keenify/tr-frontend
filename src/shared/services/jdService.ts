import { supabase } from '../../lib/supabase';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest } from '../types/jd.types';

export const jdService = {
  /**
   * Fetches all JD pages for the current user's company
   */
  async fetchJDPages(): Promise<JDPage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('jd_pages')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching JD pages:', error);
      throw error;
    }
  },

  /**
   * Fetches a single JD page by ID
   */
  async fetchJDPage(id: string): Promise<JDPage | null> {
    try {
      const { data, error } = await supabase
        .from('jd_pages')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching JD page:', error);
      throw error;
    }
  },

  /**
   * Creates a new JD page
   */
  async createJDPage(pageData: CreateJDPageRequest): Promise<JDPage> {
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
      return data;
    } catch (error) {
      console.error('Error creating JD page:', error);
      throw error;
    }
  },

  /**
   * Updates an existing JD page
   */
  async updateJDPage(id: string, pageData: UpdateJDPageRequest): Promise<JDPage> {
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
      return data;
    } catch (error) {
      console.error('Error updating JD page:', error);
      throw error;
    }
  },

  /**
   * Soft deletes a JD page by setting is_active to false
   */
  async deleteJDPage(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('jd_pages')
        .update({
          is_active: false,
          updated_by: user.id,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting JD page:', error);
      throw error;
    }
  },

  /**
   * Uploads an image and returns the URL
   */
  async uploadImage(file: File): Promise<string> {
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
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
};
