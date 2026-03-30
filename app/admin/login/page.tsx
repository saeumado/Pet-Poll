import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage(props: { searchParams: SearchParams }) {
  noStore();
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : "";
  const seconds = typeof searchParams.seconds === "string" ? Number(searchParams.seconds) : 0;
  const errorMessage =
    error === "invalid"
      ? "That password didn't match the admin secret."
      : error === "missing"
        ? "Enter the admin password."
        : error === "locked"
          ? `Too many failed attempts. Please wait ${seconds || 300} seconds and try again.`
          : "";

  return (
    <main className="shell">
      <div className="adminLogin panel">
        <span className="eyebrow">Private Admin</span>
        <h1 className="pageTitle">Open the dachshund dashboard.</h1>
        <p className="pageText">
          Use the shared admin password from your environment configuration to review entries, export the data, and
          download stored dog photos.
        </p>

        <form action="/api/admin/login" method="post" className="fieldGrid">
          <label className="field">
            <span className="label">Admin password</span>
            <input className="passwordInput" name="password" type="password" required />
          </label>
          <button className="button" type="submit">
            Enter admin
          </button>
          {errorMessage ? <p className="errorText">{errorMessage}</p> : null}
        </form>
      </div>
    </main>
  );
}
