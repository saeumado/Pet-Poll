import Link from "next/link";
import { SubmissionForm } from "@/components/submission-form";

export default function HomePage() {
  return (
    <main className="shell shellSimple">
      <section className="simplePage">
        <header className="simpleHeader">
          <div className="titleRow">
            <h1 className="simpleTitle">Hot Dog Poll</h1>
            <div className="titleDog" aria-hidden="true">
              <div className="pixelDachshund pixelDachshundInline">
                <span className="pixelDogBody" />
                <span className="pixelDogHead" />
                <span className="pixelDogTail" />
                <span className="pixelDogLeg pixelDogLegFront" />
                <span className="pixelDogLeg pixelDogLegRear" />
              </div>
            </div>
          </div>
        </header>

        <SubmissionForm />

        <p className="simpleGalleryLinkRow">
          <Link className="simpleGalleryLink" href="/cards">
            Go to gallery
          </Link>
        </p>
      </section>
    </main>
  );
}
