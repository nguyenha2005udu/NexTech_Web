export type ActionFailure = { ok: false; message: string; fieldErrors?: Record<string, string> };

/** Kết quả trả về chuẩn của Server Action. */
export type ActionResult<T = undefined> = (T extends undefined ? { ok: true } : { ok: true; data: T }) | ActionFailure;
