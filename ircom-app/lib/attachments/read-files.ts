export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export interface PendingAttachment {
  filename: string;
  mimeType: string;
  base64: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read file."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export async function parseFileList(files: FileList | null): Promise<PendingAttachment[]> {
  if (!files) {
    return [];
  }

  const next: PendingAttachment[] = [];
  for (const file of Array.from(files).slice(0, MAX_ATTACHMENTS)) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      continue;
    }
    const base64 = await readFileAsDataUrl(file);
    next.push({ filename: file.name, mimeType: file.type, base64 });
  }
  return next;
}

export function stripDataUrlPrefix(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, "");
}

export function toTeacherAttachments(attachments: PendingAttachment[]) {
  return attachments.map((item) => ({
    filename: item.filename,
    mimeType: item.mimeType,
    base64: stripDataUrlPrefix(item.base64),
  }));
}
