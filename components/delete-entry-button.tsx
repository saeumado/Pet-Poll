"use client";

type DeleteEntryButtonProps = {
  householdId: string;
};

export function DeleteEntryButton({ householdId }: DeleteEntryButtonProps) {
  return (
    <form
      action="/api/admin/delete-entry"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm("Delete this entry and all its uploaded photos?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="householdId" value={householdId} />
      <button className="secondaryButton" type="submit">
        Delete entry
      </button>
    </form>
  );
}
