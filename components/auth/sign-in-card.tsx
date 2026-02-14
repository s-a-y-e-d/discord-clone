"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/hooks/use-toast";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function SignInCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams?.get("callbackURL");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    setIsLoading(true);
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: callbackURL || undefined,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          toast({
            title: "Success",
            description: "You have successfully signed in.",
          });
          if (callbackURL) {
            window.location.href = callbackURL;
          } else {
            router.push("/");
            router.refresh();
          }
        },
        onError: (ctx) => {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: ctx.error.message || "Something went wrong.",
          });
        },
      }
    );
  }

  return (
    <Card className="w-full max-w-md border-none bg-[#313338] text-[#dbdee1] shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">Welcome Back!</CardTitle>
        <CardDescription className="text-[#b5bac1]">
          We&apos;re so excited to see you again!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      className="bg-[#1e1f22] border-none text-white focus-visible:ring-offset-0 focus-visible:ring-[#5865F2]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b5bac1]">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-[#1e1f22] border-none text-white focus-visible:ring-offset-0 focus-visible:ring-[#5865F2]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-start text-sm text-[#949BA4]">
        Need an account?
        <Link href="/sign-up" className="ml-1 text-[#00A8FC] hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}
