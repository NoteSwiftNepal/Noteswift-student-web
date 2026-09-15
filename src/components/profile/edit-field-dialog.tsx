"use client";

import { useState } from "react";
import { Pencil, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { updateUserProfile } from "@/api/student/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FieldKind = "name" | "grade" | "institution" | "location";

// Field set and per-field validation mirror profile.controller.ts's
// updateStudent exactly (name letters+spaces 2-50 chars, grade 1-12,
// institution 2-100 chars unless schoolLockedByCode, address sub-fields) —
// not EditField.tsx's client-side copy of the same rules, since the
// controller is the actual source of truth.
export function EditFieldDialog({ kind }: { kind: FieldKind }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [grade, setGrade] = useState(user?.grade ? String(user.grade) : "");
  const [institution, setInstitution] = useState(user?.address?.institution ?? "");
  const [province, setProvince] = useState(user?.address?.province ?? "");
  const [district, setDistrict] = useState(user?.address?.district ?? "");
  const [municipality, setMunicipality] = useState(user?.address?.municipality ?? "");
  const [ward, setWard] = useState(user?.address?.ward ? String(user.address.ward) : "");

  const locked = kind === "institution" && !!user?.schoolLockedByCode;

  const label =
    kind === "name" ? "Full Name" : kind === "grade" ? "Grade Level" : kind === "institution" ? "Institution / School" : "Address & Location";

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload =
        kind === "name"
          ? { full_name: fullName.trim() }
          : kind === "grade"
            ? { grade: Number(grade) }
            : kind === "institution"
              ? { address: { institution: institution.trim() } }
              : { address: { province, district, municipality, ward: ward ? Number(ward) : undefined } };

      const res = await updateUserProfile(payload);
      if (res.error || !res.result) throw new Error(res.message || "Update failed");
      updateUser(res.result.student);
      toast({ title: "Profile updated" });
      setOpen(false);
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Locked by your school's code">
        <Lock className="size-3" />
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>

        {kind === "name" && (
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
        )}

        {kind === "grade" && (
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === "institution" && (
          <div className="space-y-2">
            <Label htmlFor="institution">Institution / School</Label>
            <Input id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Your school name" />
          </div>
        )}

        {kind === "location" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipality</Label>
              <Input id="municipality" value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward">Ward</Label>
              <Input id="ward" type="number" min={1} max={100} value={ward} onChange={(e) => setWard(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
