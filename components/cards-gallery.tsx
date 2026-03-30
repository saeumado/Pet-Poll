"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import type { GalleryCard } from "@/lib/gallery-cards";

type CardsGalleryProps = {
  initialCards: GalleryCard[];
};

type VoteSuccess = {
  success: true;
  card: {
    cardId: string;
    likeCount: number;
    hasLiked: boolean;
  };
};

const fallbackError = "We couldn't save your like right now. Please try again.";

export function CardsGallery({ initialCards }: CardsGalleryProps) {
  const [cards, setCards] = useState(initialCards);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedCard = selectedCardId ? cards.find((card) => card.id === selectedCardId) ?? null : null;

  useEffect(() => {
    if (!selectedCard) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCardId(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCard]);

  function handleLike(cardId: string) {
    const card = cards.find((entry) => entry.id === cardId);

    if (!card || card.hasLiked) {
      return;
    }

    setErrorMessage(null);
    setActiveCardId(cardId);
    setCards((currentCards) =>
      currentCards.map((entry) =>
        entry.id === cardId
          ? {
              ...entry,
              hasLiked: true,
              likeCount: entry.likeCount + 1,
            }
          : entry,
      ),
    );

    startTransition(async () => {
      try {
        const response = await fetch("/api/cards/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cardId }),
        });

        const payload = (await response.json().catch(() => null)) as
          | VoteSuccess
          | { error?: string }
          | null;

        if (!response.ok || !payload || !("success" in payload)) {
          throw new Error(payload && "error" in payload && payload.error ? payload.error : fallbackError);
        }

        setCards((currentCards) =>
          currentCards.map((entry) =>
            entry.id === payload.card.cardId
              ? {
                  ...entry,
                  likeCount: payload.card.likeCount,
                  hasLiked: payload.card.hasLiked,
                }
              : entry,
          ),
        );
      } catch (error) {
        console.error("[cards] vote_request_failed", error);
        setCards((currentCards) =>
          currentCards.map((entry) =>
            entry.id === cardId
              ? {
                  ...entry,
                  hasLiked: false,
                  likeCount: Math.max(0, entry.likeCount - 1),
                }
              : entry,
          ),
        );
        setErrorMessage(error instanceof Error ? error.message : fallbackError);
      } finally {
        setActiveCardId(null);
      }
    });
  }

  return (
    <>
      <section className="cardsGrid" aria-label="Creative dog cards">
        {cards.map((card) => {
          const voteDisabled = card.hasLiked || (isPending && activeCardId === card.id);

          return (
            <article key={card.id} className="cardsItem panel">
              <div className="cardsImageWrap">
                <button
                  type="button"
                  className="cardsImageButton"
                  onClick={() => setSelectedCardId(card.id)}
                  aria-label={`Enlarge ${card.name} card`}
                >
                  <span className="cardsImageButtonLabel">Tap to enlarge</span>
                </button>

                <Image
                  className="cardsImage"
                  src={card.imageSrc}
                  alt={`${card.name} creative card`}
                  width={1200}
                  height={1600}
                  sizes="(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 33vw"
                  unoptimized
                />

                <button
                  type="button"
                  className={`cardsHeartBadge${card.hasLiked ? " cardsHeartBadgeLiked" : ""}`}
                  onClick={() => handleLike(card.id)}
                  disabled={voteDisabled}
                  aria-pressed={card.hasLiked}
                  aria-label={card.hasLiked ? `${card.name} already liked` : `Like ${card.name}`}
                >
                  <span className="cardsHeartIcon" aria-hidden="true">
                    {"\u2665"}
                  </span>
                  <span className="cardsHeartCount">{card.likeCount}</span>
                </button>
              </div>

              <div className="cardsItemBody">
                <div>
                  <h2 className="cardsName">{card.name}</h2>
                  <p className="cardsMeta">Tap the heart once to show some love, then download the card below.</p>
                </div>

                <a className="button cardsDownload" href={card.downloadHref}>
                  Download card
                </a>
              </div>
            </article>
          );
        })}
      </section>

      {errorMessage ? <p className="errorText cardsError">{errorMessage}</p> : null}

      {selectedCard ? (
        <div
          className="cardsLightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedCard.name} enlarged card`}
          onClick={() => setSelectedCardId(null)}
        >
          <div className="cardsLightboxDialog" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="cardsLightboxClose"
              onClick={() => setSelectedCardId(null)}
              aria-label="Close enlarged image"
            >
              Close
            </button>

            <div className="cardsLightboxImageWrap">
              <Image
                className="cardsLightboxImage"
                src={selectedCard.imageSrc}
                alt={`${selectedCard.name} creative card enlarged`}
                width={1200}
                height={1600}
                sizes="100vw"
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
