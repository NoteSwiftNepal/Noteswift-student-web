"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, CheckCircle2 } from "lucide-react";
import { uploadAnswerImage } from "@/api/student/test";
import { LatexText } from "@/components/latex-preview";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/test";

export function SubjectiveQuestion({
  testId,
  question,
  uploadedUrl,
  onUploaded,
}: {
  testId: string;
  question: Question;
  uploadedUrl: string | undefined;
  onUploaded: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => uploadAnswerImage(testId, question.questionNumber, file),
    onSuccess: (res) => {
      if (res.error) {
        setError(res.message);
        return;
      }
      setError(null);
      onUploaded(res.result.url);
    },
    onError: () => setError("Upload failed. Please try again."),
  });

  return (
    <div className="space-y-4">
      <div className="text-base font-medium text-foreground">
        <LatexText content={question.question} hasLatex={question.hasLatex} />
      </div>

      {question.diagramUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.diagramUrl}
          alt="Question diagram"
          className="max-h-64 rounded-lg border border-border object-contain"
        />
      )}

      <div className="rounded-lg border border-dashed border-border p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />

        {uploadedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="size-4" />
              Answer photo uploaded
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploadedUrl} alt="Submitted answer" className="max-h-72 rounded-lg border border-border" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending}
            >
              Replace photo
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="size-4" />
            {upload.isPending ? "Uploading..." : "Upload answer photo"}
          </Button>
        )}

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
