export type EmojiReaction = {
  id: string;              
  sender_id: number;        
  receiver_id: number;     
  sticker_id: string;       
  sticker_label: string;   
  size_multiplier: number;  
  count: number;            
  sender_lat: number | null;
  sender_lng: number | null;
  batch_id?: string | null;
  created_at: string;
  seen_at: string | null;
};

// What we send when inserting a new reaction
// (we omit id and created_at — Supabase generates those)
export type SendEmojiReactionPayload = Omit<EmojiReaction,
  'id' | 'created_at' | 'seen_at'
>;