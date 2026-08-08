import { createContext, useContext } from 'react';

export const OnlineContext = createContext(new Set());
export const useOnlineUsers = () => useContext(OnlineContext);
