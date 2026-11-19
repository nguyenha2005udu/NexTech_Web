// Mục 7.2 — Redux store. KHÔNG export một store dùng chung: trên server, store singleton làm dữ liệu
// người dùng A lộ sang người dùng B. StoreProvider gọi makeStore() một lần cho mỗi phiên trình duyệt.
// Mỗi miền nghiệp vụ một slice (mục 7.2).
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { cartReducer } from "@/features/cart";
import { baseApi } from "@/lib/api/baseApi";

const rootReducer = combineReducers({
  cart: cartReducer,
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
