import { supabase } from '../../lib/supabase';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest } from '../types/jd.types';

// Single JD page instance - only one page allowed
let singleJDPage: JDPage | null = null;

export const jdService = {
  /**
   * Fetches the single JD page for the current user's company
   */
  async fetchJDPages(companyId?: string): Promise<JDPage[]> {
    try {
      // Always try to fetch from database first to ensure fresh data
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Use provided company ID directly - don't query employees table
        let targetCompanyId = companyId;
        
        if (!targetCompanyId) {
          console.log('No company ID provided to fetchJDPages, returning empty array');
          return [];
        }

        // Fetch JD page by company ID instead of created_by
        const { data, error } = await supabase
          .from('jd_pages')
          .select('*')
          .eq('company_id', targetCompanyId)
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

        // Get company ID from user data or fallback to hardcoded
        let companyId = pageData.companyId;
        
        if (!companyId) {
          // If no company ID provided, we can't create a page
          throw new Error('Company ID is required to create JD page');
        }

        const { data, error } = await supabase
          .from('jd_pages')
          .insert({
            content: pageData.content,
            company_id: companyId,
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
        company_id: pageData.companyId || '04734324-c151-47c8-86ed-5b000c4e99d2',
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
      // Try to update in database first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        console.log('Updating JD page in database:', { id, pageData });

        const { data, error } = await supabase
          .from('jd_pages')
          .update({
            ...pageData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          throw error;
        }
        
        console.log('Successfully updated JD page:', data);
        singleJDPage = data;
        return data;
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        throw dbError; // Don't fall back to mock, throw the error
      }
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
  async initializeDefaultPage(companyId?: string): Promise<void> {
    if (!singleJDPage) {
      try {
        await this.createJDPage({
          title: 'Job Description',
          content: 'Welcome to your Job Description page. Click Edit to start customizing this content.',
          companyId
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
  async forceRefresh(companyId?: string): Promise<JDPage[]> {
    singleJDPage = null;
    return this.fetchJDPages(companyId);
  },

  /**
   * Forces a refresh of the public JD page by company ID
   */
  async forceRefreshPublic(companyId: string): Promise<JDPage | null> {
    try {
      const { data, error } = await supabase
        .from('jd_pages')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error force refreshing public JD page:', error);
      throw error;
    }
  },

  /**
   * Fetches JD page by company ID (public access, no authentication required)
   */
  async fetchJDPageByCompanyId(companyId: string): Promise<JDPage | null> {
    try {
      const { data, error } = await supabase
        .from('jd_pages')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching public JD page:', error);
      throw error;
    }
  },

  /**
   * Debug method to check table structure and data
   */
  async debugTableInfo(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        return;
      }

      console.log('Current user:', user.id);

      // Check if table exists and get all data
      const { data: allData, error: allError } = await supabase
        .from('jd_pages')
        .select('*');

      if (allError) {
        console.error('Error fetching all JD pages:', allError);
        console.log('This might mean the table does not exist or has RLS issues');
      } else {
        console.log('All JD pages in database:', allData);
      }

      // Check user's company
      const { data: userData, error: userError } = await supabase
        .from('employees')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user company:', userError);
      } else {
        console.log('User company ID:', userData?.company_id);
      }

      // Try to create a test record to see what happens
      console.log('Testing insert operation...');
      const testData = {
        content: 'This is a test',
        company_id: '04734324-c151-47c8-86ed-5b000c4e99d2', // Use default company ID
        created_by: user.id,
        updated_by: user.id,
      };

      const { data: insertData, error: insertError } = await supabase
        .from('jd_pages')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert test failed:', insertError);
        console.log('This confirms there is an issue with the table or permissions');
      } else {
        console.log('Insert test successful:', insertData);
        // Clean up the test record
        await supabase.from('jd_pages').delete().eq('id', insertData.id);
        console.log('Test record cleaned up');
      }

    } catch (error) {
      console.error('Debug error:', error);
    }
  },

  /**
   * Creates the jd_pages table if it doesn't exist
   */
  async createTableIfNotExists(): Promise<void> {
    try {
      // This would typically be done via SQL migration, but we can check if the table exists
      const { data, error } = await supabase
        .from('jd_pages')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Table might not exist or has issues:', error);
        console.log('You may need to create the table manually in Supabase dashboard');
        console.log('Required SQL (updated structure):');
        console.log(`
CREATE TABLE jd_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '[]'::JSONB,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT jd_pages_company_unique UNIQUE (company_id)
);

-- Enable RLS
ALTER TABLE jd_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view JD pages" ON jd_pages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert JD pages" ON jd_pages
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update JD pages they created" ON jd_pages
  FOR UPDATE USING (auth.uid() = created_by);

-- Public read access for public pages
CREATE POLICY "Public can read JD pages" ON jd_pages
  FOR SELECT USING (true);
        `);
      } else {
        console.log('Table exists and is accessible');
      }
    } catch (error) {
      console.error('Error checking table:', error);
    }
  }
};
