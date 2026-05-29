"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/icons";
import type { PendingAttachment } from "@/lib/attachments/read-files";
import { parseFileList } from "@/lib/attachments/read-files";
import type { SupportedLanguage } from "@/lib/teacher/types";

interface FileUploadButtonProps {
  language: SupportedLanguage;
  accept?: string;
  multiple?: boolean;
  files: PendingAttachment[];
  onFilesSelected: (files: PendingAttachment[]) => void;
  testId?: string;
}

export function FileUploadButton({
  language,
  accept = ".pdf,.txt,.md,image/*",
  multiple = true,
  files,
  onFilesSelected,
  testId = "file-upload-button",
}: Readonly<FileUploadButtonProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const label = language === "fr" ? "Ajouter un fichier" : "Upload file";
  const helper =
    language === "fr"
      ? "PDF, images, texte — max 3 × 4 Mo"
      : "PDF, images, text — max 3 × 4 MB";

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = await parseFileList(event.target.files);
    onFilesSelected(selected);
    event.target.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => void handleChange(event)}
        className="sr-only"
        data-testid={`${testId}-input`}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
        className="w-full sm:w-auto"
      >
        <UploadIcon className="mr-2 h-4 w-4" />
        {label}
      </Button>
      <p className="ircom-secondary text-xs">{helper}</p>
      {files.length > 0 ? (
        <ul className="ircom-secondary list-inside list-disc text-xs">
          {files.map((file) => (
            <li key={file.filename}>{file.filename}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
