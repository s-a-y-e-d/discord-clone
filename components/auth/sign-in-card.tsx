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
    <Card className="w-full max-w-md border-none bg-[#313338] text-[#dbdee1] shadow-xl mx-auto">
      <CardHeader className="text-center px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-white">Welcome Back!</CardTitle>
        <CardDescription className="text-[#b5bac1] text-sm">
          We&apos;re so excited to see you again!
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 max-h-[65vh] overflow-y-auto">
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
      <div className="px-6 mb-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#3f4147]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#313338] px-2 text-[#949BA4]">Or continue with</span>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4 bg-white text-black hover:bg-gray-200"
          onClick={async () => {
            setIsLoading(true);
            await authClient.signIn.social({
              provider: "google",
              callbackURL: callbackURL || "/",
            });
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
          )}
          Google
        </Button>
      </div>
      <CardFooter className="flex justify-start text-sm text-[#949BA4]">
        Need an account?
        <Link href="/sign-up" className="ml-1 text-[#00A8FC] hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}
