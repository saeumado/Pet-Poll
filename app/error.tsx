"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell">
      <div className="adminLogin panel">
        <p className="pageText">Something went wrong</p>
        <h1 className="pageTitle">This page hit a snag.</h1>
        <p className="pageText">{error.message || "An unexpected error occurred."}</p>
        <button className="button" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
