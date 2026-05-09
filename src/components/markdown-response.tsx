import React from 'react';
import { View, Text } from 'react-native';

type InlineNode = { t: 'text'; v: string } | { t: 'bold'; v: string };
type Block =
  | { type: 'spacer' }
  | { type: 'heading'; level: number; content: string }
  | { type: 'bullet'; content: string }
  | { type: 'paragraph'; content: string };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /\*\*([^*\n]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push({ t: 'text', v: text.slice(last, m.index) });
    nodes.push({ t: 'bold', v: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push({ t: 'text', v: text.slice(last) });
  return nodes.length ? nodes : [{ t: 'text', v: text }];
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      if (blocks.length && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
    } else if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^(#+)/) ?? ['', '#'])[1].length;
      blocks.push({ type: 'heading', level, content: line.replace(/^#+\s*/, '') });
    } else if (/^[-*]\s/.test(line)) {
      blocks.push({ type: 'bullet', content: line.replace(/^[-*]\s/, '') });
    } else {
      blocks.push({ type: 'paragraph', content: line });
    }
  }
  return blocks;
}

type Props = {
  text: string;
  streaming?: boolean;
  textColor: string;
  accentColor: string;
  fontSize?: number;
};

export function MarkdownResponse({
  text,
  streaming = false,
  textColor,
  accentColor,
  fontSize = 16,
}: Props) {
  const lh = fontSize * 1.6;
  const display = streaming ? text + ' ▇' : text;
  const blocks = parseBlocks(display);

  const Inline = ({ content }: { content: string }) => (
    <>
      {parseInline(content).map((node, i) =>
        node.t === 'bold' ? (
          <Text key={i} style={{ color: accentColor, fontWeight: '700' }}>
            {node.v}
          </Text>
        ) : (
          <Text key={i}>{node.v}</Text>
        )
      )}
    </>
  );

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'spacer') {
          return <View key={i} style={{ height: 10 }} />;
        }
        if (block.type === 'heading') {
          const size = fontSize + Math.max(0, 4 - block.level);
          return (
            <Text
              key={i}
              style={{ color: textColor, fontSize: size, fontWeight: '700', marginBottom: 6 }}
            >
              <Inline content={block.content} />
            </Text>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={i} style={{ flexDirection: 'row', marginVertical: 3, alignItems: 'flex-start' }}>
              <Text style={{ color: accentColor, marginRight: 8, fontSize, lineHeight: lh }}>
                {'•'}
              </Text>
              <Text style={{ flex: 1, color: textColor, fontSize, lineHeight: lh }}>
                <Inline content={block.content} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={{ color: textColor, fontSize, lineHeight: lh, marginBottom: 2 }}>
            <Inline content={block.content} />
          </Text>
        );
      })}
    </View>
  );
}
