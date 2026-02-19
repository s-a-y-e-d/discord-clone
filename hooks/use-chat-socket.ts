import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Member, Message, User, DirectMessage } from "@/generated/prisma";

import { useSocket } from "@/components/providers/socket-provider";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
}

type MessageWithMemberWithProfile = (Message | DirectMessage) & {
  member: Member & {
    user: User;
  }
} & {
  nonce?: string;
}

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey
}: ChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on(updateKey, (message: MessageWithMemberWithProfile) => {
      console.log(`[DEBUG] ChatSocket RECEIVED UPDATE: ${updateKey}`, message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message;
              }
              return item;
            })
          }
        });

        return {
          ...oldData,
          pages: newData,
        }
      })
    });

    socket.on(addKey, (message: MessageWithMemberWithProfile) => {
      console.log(`[DEBUG] ChatSocket RECEIVED ADD: ${addKey}`, message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{
              items: [message],
            }]
          }
        }

        const newData = [...oldData.pages];

        if (message.nonce) {
          // const optimisticIndex = newData[0].items.findIndex(
          //   (item: MessageWithMemberWithProfile) => item.nonce === message.nonce
          // );
          // Note: previously was item.id === message.nonce, but nonce is on message.
          // Wait, optimistic message might have ID == nonce?
          // Usually optimistic msg has ID = valid CUID or temp ID?
          // Let's keep logic as is but add logging.
          // actually, the previous logic was: item.id === message.nonce
        }

        // ... (rest of logic)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alreadyExists = oldData.pages.some((page: any) =>
          page.items.some((item: MessageWithMemberWithProfile) => item.id === message.id)
        );

        if (alreadyExists) {
          console.log(`[DEBUG] Message already exists in cache: ${message.id}`);
          return oldData;
        }

        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items]
        };

        return {
          ...oldData,
          pages: newData,
        };
      });
    });

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
    }
  }, [queryClient, addKey, updateKey, queryKey, socket]);
}
