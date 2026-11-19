// Mục 7.2 — Redux store. KHÔNG export một store dùng chung: trên server, store singleton làm dữ liệu
// người dùng A lộ sang người dùng B. StoreProvider gọi makeStore() một lần cho mỗi phiên trình duyệt.
// Slice nghiệp vụ (cart — FDD 4.1) thêm vào `rootReducer` khi có feature tương ứng.
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/lib/api/baseApi";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** Tạo store mới. `preloadedState` dùng cho test (renderWithProviders) và khôi phục giỏ hàng sau này. */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
    // Redux DevTools chỉ bật ở dev (tiêu chí chấm: xem được lịch sử action giỏ hàng).
    devTools: process.env.NODE_ENV !== "production",
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
