import { supabase } from '../../lib/supabase';

export const logDeletion = async (
  actionType: 'delete_attachment' | 'delete_card' | 'delete_list',
  targetId: string,
  targetTitle: string,
  userId: string,
  userName: string,
  companyId: string,
  boardModule: string
) => {
  try {
    console.log(`📝 Logging deletion: ${actionType} - ${targetTitle} by ${userName}`);
    
    const { error } = await supabase.from('tr_log').insert({
      action_type: actionType,
      target_id: targetId,
      target_title: targetTitle,
      user_id: userId,
      user_name: userName,
      company_id: companyId,
      board_module: boardModule
    });

    if (error) throw error;
    console.log(`✅ Deletion logged successfully to tr_log`);
    
  } catch (error) {
    console.error('❌ Failed to log deletion:', error);
    // Silent failure - don't break the deletion process
  }
};