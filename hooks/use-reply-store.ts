import { create } from "zustand";

interface ReplyStore {
  replyingTo: { name: string; content: string } | null;
  setReplyingTo: (data: { name: string; content: string } | null) => void;
  clearReply: () => void;
}

export const useReplyStore = create<ReplyStore>((set) => ({
  replyingTo: null,
  setReplyingTo: (data) => set({ replyingTo: data }),
  clearReply: () => set({ replyingTo: null }),
}));
