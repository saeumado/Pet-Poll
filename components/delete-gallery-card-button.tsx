"use client";

type DeleteGalleryCardButtonProps = {
  cardId: string;
  cardName: string;
};

export function DeleteGalleryCardButton({ cardId, cardName }: DeleteGalleryCardButtonProps) {
  return (
    <form
      action="/api/admin/delete-gallery-card"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${cardName}" and remove its saved gallery image?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="cardId" value={cardId} />
      <button className="linkButton" type="submit">
        Delete
      </button>
    </form>
  );
}
