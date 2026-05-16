import { supabase } from '@/components/supabase';

export async function createReport(
  reporterId: number,
  reportedId: number,
  reason: string,
) {
  const { error } = await supabase
    .from('reports')
    .insert([
      {
        created_at: new Date().toISOString(),
        reporter_id: reporterId,
        reported_id: reportedId,
        report_reason: reason,
        report_status: 'pending',
      },
    ]);

  if (error) {
    throw error;
  }
}
