"use client";

// Gọi Server Action từ form antd (dùng chung cho các màn admin): bật loading, lỗi theo ô đổ vào form,
// lỗi chung hiện bằng message. Cùng cách làm với `features/auth/hooks/useAuthAction`.
import { useTransition } from "react";
import { App } from "antd";
import type { FormInstance } from "antd";
import type { ActionFailure } from "@/types/action";

export function useFormAction(form: FormInstance) {
  const [pending, startTransition] = useTransition();
  const { message } = App.useApp();

  function run<S extends { ok: true }>(action: () => Promise<S | ActionFailure>, onSuccess: (result: S) => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onSuccess(result);
        return;
      }
      const fields = Object.entries(result.fieldErrors ?? {});
      if (fields.length) form.setFields(fields.map(([name, error]) => ({ name, errors: [error] })));
      else message.warning(result.message);
    });
  }

  return { pending, run };
}
