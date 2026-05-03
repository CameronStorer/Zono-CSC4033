// db-service.ts
import { supabase } from '@/app/(app)/database/supabase';

// basic configuration to specify which attributes to display in the admin panel
export const DATABASE_CONFIG = {
  users: {
    label: 'App Users',
    table: 'users',
    showColumns: ['id', 'username', 'email', 'phone_number', 'created_at', 'last_online', 'bio', 'status',] as const,
    widths: { 
      id: 80, 
      username: 140, 
      email: 220, 
      created_at: 180, 
      phone_number: 80,
      last_online: 70,
      bio: 150,
      status: 100, 
    } as Record<string, number>
  }
};

// logic to select everything from a table in the SupaBase DB
export const fetchTableData = async (tableName: string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

// logic for updating a row from the SupaBase db
export const upsertRow = async (tableName: string, payload: any, id?: string) => {
  const query = id 
    ? supabase.from(tableName).update(payload).eq('id', id)
    : supabase.from(tableName).insert([payload]);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// logic for deleting a row from the SupaBase db
export const deleteRow = async (tableName: string, id: string) => {
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw error;
};