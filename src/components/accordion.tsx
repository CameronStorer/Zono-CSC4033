import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function Accordion({ title, children, defaultOpen = true}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen(!open);
        }}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: '#2b2b2b',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {open ? '^ ' : '⌄ '} {title}
        </Text>
      </TouchableOpacity>

      {open && (
        <View
          style={{
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}