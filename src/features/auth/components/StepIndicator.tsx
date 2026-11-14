import styles from "./auth.module.css";

const STEPS = ["Email", "Xác thực", "Mật khẩu"] as const;
export type AuthStep = 1 | 2 | 3;

export function StepIndicator({ current }: { current: AuthStep }) {
  return (
    <ol className={styles.steps} aria-label={`Bước ${current} trên ${STEPS.length}`}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        return (
          <li key={label} className={`${styles.step} ${active ? styles.stepActive : ""}`} aria-current={active ? "step" : undefined}>
            <span className={styles.stepDot}>{step}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
