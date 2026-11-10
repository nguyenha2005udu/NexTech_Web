import type { FormRule } from "antd";
import type { ZodType } from "zod";

/** Dùng 1 schema zod làm rule cho antd Form.Item — một nguồn validate cho cả client lẫn Server Action. */
export function zodRule(schema: ZodType): FormRule {
  return {
    validator: async (_rule, value: unknown) => {
      const result = schema.safeParse(value);
      if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Giá trị không hợp lệ");
    },
  };
}
