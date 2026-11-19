import { baseApi } from "@/lib/api/baseApi";
import { makeStore } from "./store";

describe("makeStore", () => {
  it("mỗi lần gọi tạo một store riêng (không singleton)", () => {
    const a = makeStore();
    const b = makeStore();
    expect(a).not.toBe(b);
    expect(a.getState()).not.toBe(b.getState());
  });

  it("có sẵn reducer của RTK Query", () => {
    const state = makeStore().getState();
    expect(state).toHaveProperty(baseApi.reducerPath);
    expect(state[baseApi.reducerPath].queries).toEqual({});
  });

  it("nhận preloadedState", () => {
    const base = makeStore().getState();
    const store = makeStore({ [baseApi.reducerPath]: base[baseApi.reducerPath] });
    expect(store.getState()[baseApi.reducerPath]).toEqual(base[baseApi.reducerPath]);
  });
});
