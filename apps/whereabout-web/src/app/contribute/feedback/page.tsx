import type { Metadata } from "next";
import { MdOutlineFeedback } from "react-icons/md";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import styles from "../Contribute.module.css";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = { title: "General feedback · whereabout" };

// Site-wide feedback, not tied to a country. Same postcard as /contribute.
export default function Feedback() {
  return (
    <PaperTexture color="var(--ocean)">
      <SiteHeader />
      <main className={styles.main}>
        <div className="tk-eyebrow" style={{ color: "rgba(26, 21, 32, 0.6)" }}>
          GET INVOLVED
        </div>
        <h1 className={styles.title}>General feedback</h1>

        <section className={styles.option}>
          <div className={styles.head}>
            <MdOutlineFeedback size={22} aria-hidden />
            <h2 className="sec-name">Tell us anything</h2>
          </div>
          <div className={styles.feedbackBody}>
            <p className="s-body" style={{ padding: "18px 20px 0" }}>
              Something about whereabout as a whole, not one country: a bug, an idea, something confusing, or what
              you&apos;d like to see next.
            </p>
            <FeedbackForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}
