import { StarIcon } from "@/components/ui/icons";
import { formatRating } from "@/lib/format";
import styles from "./ProductCard.module.css";

export function Rating({ value }: { value: number }) {
  return (
    <span className={styles.rating} aria-label={`Đánh giá ${formatRating(value)} trên 5`}>
      <StarIcon /> {formatRating(value)}
    </span>
  );
}
