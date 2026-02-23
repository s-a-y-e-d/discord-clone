"use client";

import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  apiKey: z.string().min(1, {
    message: "API Key is required.",
  }),
});

export const UnlockAiModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "unlockAi";
  const { profile } = data;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post("/api/user/gemini-api-key", values);

      form.reset();
      router.refresh();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden dark:bg-card dark:text-zinc-100">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold dark:text-zinc-100">
            Unlock AI Features
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400">
            Provide your Gemini API key to enable StudyBot functionality.
            {profile?.name ? ` This key will be securely encrypted and linked to ${profile.name}'s account.` : ""}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Gemini API Key
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0 dark:bg-zinc-700/50 dark:text-white"
                        placeholder="Enter your Gemini API key"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                Get your free key at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:underline"
                >
                  https://aistudio.google.com/app/apikey
                </a>
              </div>
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4 dark:bg-zinc-900/50">
              <Button disabled={isLoading} variant="default">
                Save API Key
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
