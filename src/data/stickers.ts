// This file is the single source of truth for all stickers in the app.
// Every component that needs to show stickers imports from here.
// To add a new sticker: add the PNG to src/assets/stickers/ and add
// one entry to this array. Nothing else needs to change.

export type StickerItem = {
  id: string;         
  label: string;     
  source: number;
};

const STICKERS: StickerItem[] = [
  {
    id: 'hi',
    label: 'Hi',
    source: require('@/assets/stickers/hi.png'),
  },
  {
    id: 'cry',
    label: 'Cry',
    source: require('@/assets/stickers/cry.png'),
  },
  {
    id: 'eye',
    label: 'Eye',
    source: require('@/assets/stickers/eye.png'),
  },
  {
    id: 'fire',
    label: 'Fire',
    source: require('@/assets/stickers/fire.png'),
  },
  {
    id: 'like',
    label: 'Like',
    source: require('@/assets/stickers/like.png'),
  },
  {
    id: 'poop',
    label: 'Poop Gift',
    source: require('@/assets/stickers/poop.png'),
  },
  {
    id: 'ThumbUp',
    label: 'Thumb Up',
    source: require('@/assets/stickers/ThumbUp.png'),
  },
  {
    id: 'heart',
    label: 'Heart',
    source: require('@/assets/stickers/heart.png'),
  },
];

export default STICKERS;