import { supabase } from '@/components/supabase';

export async function getBlockStatus(blockerId: number, blockedId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();

  if (error) {
    console.log('getBlockStatus error:', error);
    return false;
  }

  return data != null;
}

export async function blockUser(blockerId: number, blockedId: number): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .insert([{ blocker_id: blockerId, blocked_id: blockedId }]);

  if (error) throw error;
}

export async function unblockUser(blockerId: number, blockedId: number): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) throw error;
}
