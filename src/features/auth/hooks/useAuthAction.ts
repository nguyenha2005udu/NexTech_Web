"use client";

import { useTransition } from "react";
import { App } from "antd";
import type { FormInstance } from "antd";
import type { ActionFailure } from "@/types/action";

/**
 * Gọi Server Action từ form antd: bật trạng thái loading, đổ lỗi theo field
 * vào form, lỗi chung hiện bằng message.
 */
export function useAuthAction(form: FormInstance) {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function run<S extends { ok: true }>(
    action: (input: unknown) => Promise<S | ActionFailure>,
    input: unknown,
    onSuccess: (result: S) => void,
  ) {
    startTransition(async () => {
      const result = await action(input);
      if (result.ok) {
        onSuccess(result);
        return;
      }
      const fields = Object.entries(result.fieldErrors ?? {});
      if (fields.length) {
        form.setFields(fields.map(([name, error]) => ({ name, errors: [error] })));
      } else {
        message.warning(result.message);
      }
    });
  }

  return { pending, run };
}
