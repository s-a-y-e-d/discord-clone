import { create } from "zustand";

interface ScrollToMessageStore {
  targetMessageId: string | null;
  scrollToMessage: (messageId: string) => void;
  clearTarget: () => void;
}

export const useScrollToMessage = create<ScrollToMessageStore>((set) => ({
  targetMessageId: null,
  scrollToMessage: (messageId) => set({ targetMessageId: messageId }),
  clearTarget: () => set({ targetMessageId: null }),
}));
