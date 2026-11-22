"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { IconType } from "react-icons";
import { MdClose } from "react-icons/md";
import type { SectionColors } from "@/lib/color";
import styles from "./PostageSheet.module.css";

export interface SheetContent {
  title: string;
  icon: IconType;
  colors: SectionColors;
  body: React.ReactNode;
}

// Bottom sheet headed by the card's flag color.
export default function PostageSheet({ sheet, onClose }: { sheet: SheetContent | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Layout effect: open before children (e.g. Leaflet) measure.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (sheet && !dialog.open) dialog.showModal();
    if (!sheet && dialog.open) dialog.close();
  }, [sheet]);

  useEffect(() => {
    if (!sheet) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [sheet]);

  // Border-country links navigate away.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const Icon = sheet?.icon;
  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={sheet?.title}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {sheet && Icon && (
        <div className={styles.panel}>
          <span className={styles.hole} aria-hidden />
          <div className={styles.header} style={{ background: sheet.colors.tint, color: sheet.colors.textColor }}>
            <Icon size={22} aria-hidden />
            <h2 className="sec-name" style={{ flex: 1, color: sheet.colors.textColor }}>
              {sheet.title}
            </h2>
            <button className={styles.close} onClick={onClose} aria-label="Close" title="Close">
              <MdClose size={22} aria-hidden />
            </button>
          </div>
          <div className={styles.body}>{sheet.body}</div>
        </div>
      )}
    </dialog>
  );
}
