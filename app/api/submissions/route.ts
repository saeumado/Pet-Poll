import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { submissionSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

class SubmissionError extends Error {
  code: string;
  status: number;
  userMessage: string;

  constructor(code: string, status: number, userMessage: string, internalMessage?: string) {
    super(internalMessage ?? userMessage);
    this.code = code;
    this.status = status;
    this.userMessage = userMessage;
  }
}

function jsonError(error: SubmissionError) {
  return NextResponse.json(
    {
      code: error.code,
      error: error.userMessage,
    },
    {
      status: error.status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const householdName = String(formData.get("householdName") ?? "");
    const dachshundCount = Number(formData.get("dachshundCount") ?? 0);

    const dogs = Array.from({ length: dachshundCount }, (_, index) => ({
      name: String(formData.get(`dogName-${index}`) ?? ""),
      file: formData.get(`dogPhoto-${index}`),
    }));

    const parsed = submissionSchema.safeParse({
      householdName,
      dachshundCount,
      dogs,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Your submission could not be validated.";
      return jsonError(new SubmissionError("validation_error", 400, message));
    }

    let supabase;
    let bucket;

    try {
      supabase = createServerSupabaseClient();
      ({ bucket } = getServerEnv());
    } catch (error) {
      console.error("[submissions] missing_env", error);
      return jsonError(
        new SubmissionError("missing_env", 500, "The server is missing a required setting. Please try again later."),
      );
    }

    const householdId = randomUUID();
    const uploadedPaths: string[] = [];
    const safeHouseholdSlug = slugify(parsed.data.householdName) || "household";

    try {
      for (let index = 0; index < parsed.data.dogs.length; index += 1) {
        const dog = parsed.data.dogs[index];
        const extension = getExtension(dog.file);
        const dogSlug = slugify(dog.name) || `dog-${index + 1}`;
        const originalStoragePath = `${householdId}/original/${safeHouseholdSlug}-${dogSlug}-${index + 1}.${extension}`;
        const bytes = await dog.file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(originalStoragePath, bytes, {
            contentType: dog.file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new SubmissionError(
            "upload_failed",
            500,
            "We couldn't upload that photo right now. Please try again.",
            `Upload failed for ${dog.name}: ${uploadError.message}`,
          );
        }

        uploadedPaths.push(originalStoragePath);
      }

      const { error: householdError } = await supabase.from("households").insert({
        id: householdId,
        household_name: parsed.data.householdName || null,
        dachshund_count: parsed.data.dachshundCount,
      });

      if (householdError) {
        throw new SubmissionError(
          "db_failed",
          500,
          "We couldn't save that entry right now. Please try again.",
          `Household save failed: ${householdError.message}`,
        );
      }

      const dogRows = parsed.data.dogs.map((dog, index) => ({
        household_id: householdId,
        name: dog.name,
        storage_path: uploadedPaths[index],
        original_filename: dog.file.name,
        content_type: dog.file.type,
      }));

      const { error: dogError } = await supabase.from("dogs").insert(dogRows);

      if (dogError) {
        const { error: deleteHouseholdError } = await supabase.from("households").delete().eq("id", householdId);

        if (deleteHouseholdError) {
          console.error("[submissions] rollback_household_failed", deleteHouseholdError);
        }

        throw new SubmissionError(
          "db_failed",
          500,
          "We couldn't save that entry right now. Please try again.",
          `Dog save failed: ${dogError.message}`,
        );
      }

      const { data: totals, error: totalError } = await supabase.from("households").select("dachshund_count");

      if (totalError) {
        throw new SubmissionError(
          "db_failed",
          500,
          "Your submission was saved, but we couldn't refresh the live total right now.",
          `Failed to load total dachshund count: ${totalError.message}`,
        );
      }

      const totalDachshunds = (totals ?? []).reduce((sum, row) => sum + row.dachshund_count, 0);

      return NextResponse.json({
        success: true,
        householdName: parsed.data.householdName || null,
        dogCount: parsed.data.dachshundCount,
        totalDachshunds,
        message: parsed.data.householdName
          ? `Thanks, ${parsed.data.householdName}! Your submission is complete.`
          : "Your submission is complete.",
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(uploadedPaths);

        if (cleanupError) {
          console.error("[submissions] cleanup_failed", cleanupError);
        }
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof SubmissionError) {
      console.error(`[submissions] ${error.code}`, error.message);
      return jsonError(error);
    }

    console.error("[submissions] unexpected_error", error);
    return jsonError(
      new SubmissionError("unexpected_error", 500, "We couldn't save that entry right now. Please try again in a moment."),
    );
  }
}
