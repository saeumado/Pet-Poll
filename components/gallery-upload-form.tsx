"use client";

import { ChangeEvent, FormEvent, useState, useTransition } from "react";
import { MAX_FILE_SIZE, MAX_GALLERY_UPLOAD_TOTAL_SIZE } from "@/lib/validation";

type GalleryUploadResponse = {
  error?: string;
  success?: string;
};

type GalleryUploadFormProps = {
  initialError?: string;
  initialSuccess?: string;
};

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
}

function readUploadErrorMessage(payload?: GalleryUploadResponse, status?: number) {
  if (payload?.error) {
    return payload.error;
  }

  if (status === 413) {
    return "Those images are too large together. Upload fewer or smaller files.";
  }

  return "We couldn't save that gallery change right now. Please try again.";
}

async function readUploadResponse(response: Response): Promise<GalleryUploadResponse | undefined> {
  const raw = await response.text();

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as GalleryUploadResponse;
  } catch {
    return undefined;
  }
}

function validateFiles(files: File[] | FileList | null) {
  const selectedFiles = Array.from(files ?? []);

  if (selectedFiles.length === 0) {
    return "Choose at least one image to upload.";
  }

  for (const file of selectedFiles) {
    if (file.size <= 0) {
      return "Choose an image to upload.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Each image must be 4 MB or smaller.";
    }
  }

  const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

  if (totalSize > MAX_GALLERY_UPLOAD_TOTAL_SIZE) {
    return "Those images are too large together. Upload fewer or smaller files.";
  }

  return null;
}

export function GalleryUploadForm({ initialError, initialSuccess }: GalleryUploadFormProps) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [success, setSuccess] = useState<string | null>(initialSuccess ?? null);
  const [isPending, startTransition] = useTransition();

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    clearMessages();
    const validationError = validateFiles(event.target.files);

    if (validationError) {
      setError(validationError);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    const validationError = validateFiles(files);

    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/gallery", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });
        const payload = await readUploadResponse(response);

        if (!response.ok) {
          setError(readUploadErrorMessage(payload, response.status));
          return;
        }

        setSuccess(payload?.success ?? `${files.length} gallery card(s) uploaded.`);
        form.reset();
      } catch (submitError) {
        console.error(submitError);
        setError("We couldn't save that gallery change right now. Please try again.");
      }
    });
  }

  return (
    <form className="galleryAdminForm" action="/api/admin/gallery" method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
      <input type="hidden" name="intent" value="create" />

      <label className="field">
        <span className="label">Gallery images</span>
        <input
          className="input"
          name="files"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          required
          onChange={handleFileChange}
        />
        <span className="hint">
          Choose one or many final JPG, PNG, or WebP card images. Each image can be up to {formatMegabytes(MAX_FILE_SIZE)},
          and each upload can total up to {formatMegabytes(MAX_GALLERY_UPLOAD_TOTAL_SIZE)}.
        </span>
      </label>

      <label className="field">
        <span className="label">Visibility</span>
        <select className="input" name="isPublished" defaultValue="true">
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </select>
      </label>

      <div className="buttonRow">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Uploading..." : "Upload gallery cards"}
        </button>
      </div>

      {isPending ? <p className="hint">Please wait while the gallery images upload.</p> : null}
      {success ? <p className="successText">{success}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}
    </form>
  );
}
