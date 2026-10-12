"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Smartphone } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const phoneSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export function PhoneStep({ onOtpSent }: { onOtpSent: (phoneNumber: string) => void }) {
  const sendPhoneOtp = useAuthStore((state) => state.sendPhoneOtp);
  const isLoading = useAuthStore((state) => state.isLoading);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone_number: "" },
  });

  const onSubmit = async ({ phone_number }: PhoneFormValues) => {
    const success = await sendPhoneOtp(phone_number);
    if (success) {
      toast({ title: "OTP sent", description: "Check your phone for the verification code." });
      onOtpSent(phone_number);
    } else {
      toast({
        title: "Failed to send OTP",
        description: useAuthStore.getState().apiMessage || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" />
                Phone number
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  autoFocus
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-12 w-full text-base font-semibold shadow-md" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLoading ? "Sending..." : "Send code"}
        </Button>
      </form>
    </Form>
  );
}
