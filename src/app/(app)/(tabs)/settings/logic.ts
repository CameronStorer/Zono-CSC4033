// basic configuration to specify which attributes to display in the admin panel
export const DATABASE_CONFIG = {
  users: {
    label: 'Settings',
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


// logic for updating a row from the SupaBase db
export const upsertRow = async (tableName: string, payload: any, id?: string) => {
};