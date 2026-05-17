import { supabase } from '@/components/supabase';
import { EmojiReaction, SendEmojiReactionPayload } from '@/types/emojiReaction';
import { RealtimeChannel } from '@supabase/supabase-js';

// SEND a sticker reaction to a friend
// Call this when the user taps or releases a sticker.

export async function sendEmojiReaction(
  payload: SendEmojiReactionPayload
): Promise<EmojiReaction> {
  const { data, error } = await supabase
    .from('emoji_reactions')
    .insert(payload)
    .select()   // return the inserted row so we get the generated id
    .single();  // we inserted one row, so return one object

  if (error) {
    console.error('[EmojiReactionService] sendEmojiReaction error:', error);
    throw error;
  }

  return data as EmojiReaction;
}

// SUBSCRIBE to incoming sticker reactions
// Call this once when the map screen mounts.
// Pass in:
//   receiverId  → the current logged-in user's int8 id
//   onIncoming  → a callback that runs when a new sticker arrives
//
// Returns a cleanup function — call it when the screen unmounts

export function subscribeToIncomingEmojiReactions(
  receiverId: number,
  onIncoming: (reaction: EmojiReaction) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`incoming_reactions_${receiverId}`) // unique channel name per user
    .on(
      'postgres_changes',         // listen to database changes
      {
        event: 'INSERT',          
        schema: 'public',
        table: 'emoji_reactions',
        filter: `receiver_id=eq.${receiverId}`, // only MY incoming reactions
      },
      (payload) => {
        // payload.new contains the full inserted row as an object
        const reaction = payload.new as EmojiReaction;
        console.log('[EmojiReactionService] Incoming reaction:', reaction);
        onIncoming(reaction);
      }
    )
    .subscribe((status) => {
      console.log('[EmojiReactionService] Realtime status:', status);
    });

  // Return a cleanup function for useEffect
  // The map screen will call this when it unmounts
  return () => {
    supabase.removeChannel(channel);
  };
}

// MARK a reaction as seen
// Call this after the receiver's animation finishes playing. set up seen at

export async function markReactionSeen(reactionId: string): Promise<void> {
  const { error } = await supabase
    .from('emoji_reactions')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', reactionId);

  if (error) {
    console.error('[EmojiReactionService] markReactionSeen error:', error);
  }
}

// ── FETCH all unseen reactions for a user ─────────────────────
// Called when the map screen mounts.
// Gets reactions that arrived while user was offline OR
// reactions that Realtime delivered but were never marked seen.
// Ordered oldest first so they display in the order they were sent.

export async function getUnseenEmojiReactions(
  receiverId: number
): Promise<EmojiReaction[]> {
  const { data, error } = await supabase
    .from('emoji_reactions')
    .select('*')
    .eq('receiver_id', receiverId)
    .is('seen_at', null)                          // only unseen
    .order('created_at', { ascending: true });     // oldest first

  if (error) {
    console.error('[EmojiReactionService] getUnseenEmojiReactions:', error);
    throw error;
  }

  return (data ?? []) as EmojiReaction[];
}