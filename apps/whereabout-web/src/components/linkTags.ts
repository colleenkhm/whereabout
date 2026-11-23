import styles from "./linkTags.module.css";

// outline: colored header/footer bar. white: ink bar. filled: home page, over the flags.
export type TagVariant = "outline" | "white" | "filled";

export const tagClass = (variant: TagVariant) => `tf-link lift ${styles.tag} ${styles[variant]}`;
