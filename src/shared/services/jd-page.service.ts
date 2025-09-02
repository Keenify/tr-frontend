import { supabase } from '../../lib/supabase';
import { JDPage, CreateJDPageRequest, UpdateJDPageRequest } from '../types/jd-page.types';

export class JDPageService {
  static async getAllJDPages(): Promise<JDPage[]> {
    const { data, error } = await supabase
      .from('jd_pages')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch JD pages: ${error.message}`);
    }

    return data || [];
  }

  static async getJDPageById(id: string): Promise<JDPage | null> {
    const { data, error } = await supabase
      .from('jd_pages')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch JD page: ${error.message}`);
    }

    return data;
  }

  static async createJDPage(request: CreateJDPageRequest): Promise<JDPage> {
    const { data, error } = await supabase
      .from('jd_pages')
      .insert([request])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create JD page: ${error.message}`);
    }

    return data;
  }

  static async updateJDPage(id: string, request: UpdateJDPageRequest): Promise<JDPage> {
    const { data, error } = await supabase
      .from('jd_pages')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update JD page: ${error.message}`);
    }

    return data;
  }

  static async deleteJDPage(id: string): Promise<void> {
    const { error } = await supabase
      .from('jd_pages')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete JD page: ${error.message}`);
    }
  }

  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `jd-pages/images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return publicUrl;
  }
}
