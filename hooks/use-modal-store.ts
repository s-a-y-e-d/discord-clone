import { Channel, ChannelType, Server } from '@/generated/prisma'
import { create } from 'zustand'

export type ModalType = "createServer" | "invite" | "updateServer" | "members" | "createChannel" | "leaveServer" | "deleteServer" | "editChannel" | "deleteChannel" | "messageFile" | "deleteMessage" | "unlockAi";

type ModalData = {
  server?: Server;
  channel?: Channel;
  channelType?: ChannelType;
  apiUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Record<string, any>;
  profile?: { id: string, name: string, encryptedGeminiApiKey?: string | null };
}

type ModalStore = {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void
}

export const useModal = create<ModalStore>()((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ isOpen: false, type: null }),
}))