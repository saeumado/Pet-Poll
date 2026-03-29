type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage =
    error === "invalid" ? "That password didn't match the admin secret." : error === "missing" ? "Enter the admin password." : "";

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
