import { supabase } from '../../lib/supabase';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest, DeleteJDPageResponse } from '../types/jd.types';

const TABLE_NAME = 'jd_pages_v2';
const MAX_PAGES_PER_COMPANY = 50;

export const jdService = {
  /**
   * Fetches all JD pages for a company, ordered by last edited
   */
  async fetchJDPages(companyId: string): Promise<JDPage[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
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
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching JD page:', error);
      throw error;
    }
  },

  /**
   * Fetches a JD page by company ID and slug (for public URLs)
   */
  async fetchPageBySlug(companyId: string, slug: string): Promise<JDPage | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching JD page by slug:', error);
      throw error;
    }
  },

  /**
   * Counts active pages for a company
   */
  async countPages(companyId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('count_company_pages_v2', { p_company_id: companyId });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error counting pages:', error);
      throw error;
    }
  },

  /**
   * Checks if company can create more pages (50 limit)
   */
  async canCreatePage(companyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_create_page_v2', { p_company_id: companyId });

      if (error) throw error;

      return data || false;
    } catch (error) {
      console.error('Error checking page limit:', error);
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

      const companyId = pageData.companyId;
      if (!companyId) {
        throw new Error('Company ID is required to create JD page');
      }

      // Check page limit
      const canCreate = await this.canCreatePage(companyId);
      if (!canCreate) {
        throw new Error(`Maximum ${MAX_PAGES_PER_COMPANY} pages per company reached`);
      }

      // Generate unique slug from title
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug_v2', {
          p_title: pageData.title,
          p_company_id: companyId
        });

      if (slugError) throw slugError;

      const slug = slugData as string;

      // Get next display order
      const { data: displayOrder, error: orderError } = await supabase
        .rpc('get_next_display_order_v2', { p_company_id: companyId });

      if (orderError) throw orderError;

      // Create page
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
          title: pageData.title,
          slug: slug,
          content: pageData.content || '<h2 style="text-align: center"><strong><em><u>Welcome to your Job Description page. Click Edit to start customizing this content.</u></em></strong></h2>',
          company_id: companyId,
          created_by: user.id,
          updated_by: user.id,
          display_order: displayOrder || 0
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
        .from(TABLE_NAME)
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
   * Deletes a JD page and returns the next page to switch to
   */
  async deleteJDPage(id: string, companyId: string): Promise<DeleteJDPageResponse> {
    try {
      // Check how many pages exist
      const pageCount = await this.countPages(companyId);

      // Don't allow deleting the last page
      if (pageCount <= 1) {
        throw new Error('Cannot delete the last page. At least one page must exist.');
      }

      // Get all pages to find next page
      const allPages = await this.fetchJDPages(companyId);
      const pageToDelete = allPages.find(p => p.id === id);

      if (!pageToDelete) {
        throw new Error('Page not found');
      }

      // Find next page (first one that's not being deleted)
      const nextPage = allPages.find(p => p.id !== id);

      // Delete the page
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        nextPageId: nextPage?.id
      };
    } catch (error) {
      console.error('Error deleting JD page:', error);
      throw error;
    }
  },

  /**
   * Uploads an image to storage
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

  /**
   * Ensures company has at least one default page
   */
  async ensureDefaultPage(companyId: string): Promise<JDPage> {
    try {
      const pages = await this.fetchJDPages(companyId);

      if (pages.length === 0) {
        // Create default page
        return await this.createJDPage({
          title: 'Job Description',
          content: '<h2 style="text-align: center"><strong><em><u>Welcome to your Job Description page. Click Edit to start customizing this content.</u></em></strong></h2>',
          companyId
        });
      }

      return pages[0];
    } catch (error) {
      console.error('Error ensuring default page:', error);
      throw error;
    }
  }
};
