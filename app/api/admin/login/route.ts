import { NextResponse } from "next/server";
import { getAdminLoginCooldownSeconds, registerFailedAdminLogin, setAdminSession } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const cooldownSeconds = await getAdminLoginCooldownSeconds();

  if (cooldownSeconds > 0) {
    return NextResponse.redirect(new URL(`/admin/login?error=locked&seconds=${cooldownSeconds}`, request.url), {
      status: 303,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const formData = await request.formData();
  const parsed = adminLoginSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/login?error=missing", request.url), {
      status: 303,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const { adminPassword } = getServerEnv();

  if (parsed.data.password !== adminPassword) {
    const lockSeconds = await registerFailedAdminLogin();
    const url =
      lockSeconds > 0 ? new URL(`/admin/login?error=locked&seconds=${lockSeconds}`, request.url) : new URL("/admin/login?error=invalid", request.url);

    return NextResponse.redirect(url, {
      status: 303,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  await setAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
