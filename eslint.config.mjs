import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
  // Luật vàng #5 (mục 7.2): chỉ dùng useAppSelector / useAppDispatch / useAppStore từ @/lib/hooks.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/hooks.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-redux",
              importNames: ["useSelector", "useDispatch", "useStore"],
              message: "Dùng useAppSelector / useAppDispatch / useAppStore từ @/lib/hooks.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
