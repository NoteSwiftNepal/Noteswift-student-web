"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Continue"}
        </Button>
      </form>
    </Form>
  );
}
