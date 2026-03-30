import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { CardsGallery } from "@/components/cards-gallery";
import { GALLERY_CARD_VOTER_COOKIE, listPublishedGalleryCards } from "@/lib/gallery-cards";

export const metadata: Metadata = {
  title: "SausageMon's Gallery Page | Hot Dog Poll",
  description: "SausageMon's Gallery Page for finished custom dog cards.",
};

export default async function CardsPage() {
  noStore();
  const cookieStore = await cookies();
  const voterToken = cookieStore.get(GALLERY_CARD_VOTER_COOKIE)?.value ?? null;
  const cards = await listPublishedGalleryCards(voterToken);

  return (
    <main className="shell shellSimple">
      <section className="cardsPage">
        <header className="cardsHeader">
          <div className="cardsHeaderTop">
            <Link className="cardsBackLink" href="/">
              Back to poll
            </Link>
          </div>

          <div className="cardsIntro">
            <Image
              className="cardsLogo"
              src="/sausagemon-logo-2.jpg"
              alt="SausageMon"
              width={1696}
              height={608}
              priority
            />
          </div>
        </header>

        <CardsGallery initialCards={cards} />
      </section>
    </main>
  );
}
