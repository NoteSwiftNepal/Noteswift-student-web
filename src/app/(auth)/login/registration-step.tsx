"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Mirrors the fields mobile's completeRegistration screen collects
// (blueprint §5.4). Province/district/municipality are plain text here
// rather than mobile's cascading Nepal-location picker — a UI simplification
// for this phase, not a contract change.
const registrationSchema = z.object({
  full_name: z.string().trim().min(3, "Full name must be at least 3 characters"),
  grade: z.coerce.number().int().min(1, "Grade must be 1-12").max(12, "Grade must be 1-12"),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select your gender" }),
  dateOfBirth: z.string().optional(),
  province: z.string().trim().min(1, "Province is required"),
  district: z.string().trim().min(1, "District is required"),
  municipality: z.string().trim().min(1, "Municipality is required"),
  ward: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  institution: z.string().trim().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationStep({
  phoneNumber,
  onRegistered,
}: {
  phoneNumber: string;
  onRegistered: () => void;
}) {
  const completeRegistration = useAuthStore((state) => state.completeRegistration);
  const isLoading = useAuthStore((state) => state.isLoading);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: "",
      grade: undefined,
      gender: undefined,
      dateOfBirth: "",
      province: "",
      district: "",
      municipality: "",
      ward: undefined,
      institution: "",
    },
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    const success = await completeRegistration({
      phone_number: phoneNumber,
      full_name: values.full_name,
      grade: values.grade,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
      province: values.province,
      district: values.district,
      municipality: values.municipality,
      ward: values.ward,
      institution: values.institution || undefined,
    });

    if (success) {
      toast({ title: "Welcome to NoteSwift!", description: "Registration successful." });
      onRegistered();
    } else {
      toast({
        title: "Registration failed",
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
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="1-12"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth (optional)</FormLabel>
              <FormControl>
                <Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province</FormLabel>
                <FormControl>
                  <Input placeholder="Bagmati" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Input placeholder="Kathmandu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Municipality</FormLabel>
                <FormControl>
                  <Input placeholder="Kathmandu Metropolitan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ward (optional)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School / institution (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter your school's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Complete Setup"}
        </Button>
      </form>
    </Form>
  );
}
