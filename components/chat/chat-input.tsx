"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SendHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Member, Message, User, DirectMessage } from "@/generated/prisma";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";

interface ChatInputProps {
  apiUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
  member: Member & {
    user: User;
  }
}

type MessageWithMemberWithProfile = (Message | DirectMessage) & {
  member: Member & {
    user: User;
  }
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatInput = ({
  apiUrl,
  query,
  name,
  type,
  member,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    }
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      const queryKey = `chat:${type === "conversation" ? query.conversationId : query.channelId}`;
      const now = new Date();

      const optimisticMessage: MessageWithMemberWithProfile = {
        id: Date.now().toString(),
        content: values.content,
        fileUrl: null,
        memberId: member.id,
        member: member,
        deleted: false,
        createdAt: now,
        updatedAt: now,
        ...(type === "conversation" ? {
          conversationId: query.conversationId,
        } : {
          channelId: query.channelId,
        }),
      } as MessageWithMemberWithProfile;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{
              items: [optimisticMessage],
            }]
          };
        }

        const newData = [...oldData.pages];

        newData[0] = {
          ...newData[0],
          items: [optimisticMessage, ...newData[0].items]
        };

        return {
          ...oldData,
          pages: newData,
        };
      });

      await axios.post(url, {
        ...values,
        nonce: optimisticMessage.id,
      });

      form.reset();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6 flex items-center gap-x-2">
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => onOpen("messageFile", { apiUrl, query })}
                      className="absolute top-3 left-4 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-white transition rounded-full p-1 flex items-center justify-center"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>
                    <Input
                      disabled={isLoading}
                      className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 rounded-full"
                      placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                      {...field}
                    />
                    <div className="absolute top-3 right-4 flex items-center gap-x-2">
                      <EmojiPicker
                        onChange={(emoji: string) => field.onChange(`${field.value} ${emoji}`)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-12 bg-primary hover:bg-primary/90 transition rounded-full p-2 flex items-center justify-center shrink-0"
                  >
                    <SendHorizontal className="text-primary-foreground h-5 w-5" />
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
