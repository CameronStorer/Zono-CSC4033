import React, { createContext, useContext, useRef } from 'react';

type TabNavContextType = {
  getPrevIndex: () => number;
  setCurrentIndex: (i: number) => void;
};

const TabNavContext = createContext<TabNavContextType>({
  getPrevIndex: () => 0,
  setCurrentIndex: () => {},
});

export function TabNavProvider({ children }: { children: React.ReactNode }) {
  // Stores the currently displayed tab index.
  // getPrevIndex reads it BEFORE setCurrentIndex updates it, giving the correct "from" index.
  const currentIndexRef = useRef(0);

  const getPrevIndex = () => currentIndexRef.current;
  const setCurrentIndex = (i: number) => { currentIndexRef.current = i; };

  return (
    <TabNavContext.Provider value={{ getPrevIndex, setCurrentIndex }}>
      {children}
    </TabNavContext.Provider>
  );
}

export const useTabNav = () => useContext(TabNavContext);
