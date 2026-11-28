import styles from "./Listing.module.css";

type Props = {
  /** Số sản phẩm đang hiển thị */
  shown: number;
  total: number;
  /** Thứ tự (từ 1) của sản phẩm đầu trang, khi kết quả có phân trang: hiện "25–48 / 161" thay vì "24 / 161" */
  from?: number;
};

export function ResultCount({ shown, total, from }: Props) {
  const range = from !== undefined && shown > 0 ? `${from}–${from + shown - 1}` : String(shown);
  return (
    <p className={styles.count} aria-live="polite">
      Hiển thị {range} / {total} sản phẩm
    </p>
  );
}
