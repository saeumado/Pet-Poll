import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = adminLoginSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", request.url));
  }

  const { adminPassword } = getServerEnv();

  if (parsed.data.password !== adminPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }

  await setAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url));
}
