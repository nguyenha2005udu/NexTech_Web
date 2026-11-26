import { renderHook, waitFor } from "@testing-library/react";
import { useSignedIn } from "./useSignedIn";

function mockSession(response: Promise<unknown>) {
  const fetchMock = jest.fn(() => response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const ok = (body: unknown) => Promise.resolve({ json: () => Promise.resolve(body) });

describe("useSignedIn", () => {
  it("trả null trong lúc đang hỏi phiên", () => {
    mockSession(new Promise(() => {}));
    const { result } = renderHook(() => useSignedIn());
    expect(result.current).toBeNull();
  });

  it("true khi /api/session trả người dùng", async () => {
    const fetchMock = mockSession(ok({ user: { full_name: "Minh Anh", role: "user" } }));
    const { result } = renderHook(() => useSignedIn());
    await waitFor(() => expect(result.current).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith("/api/session", expect.objectContaining({ cache: "no-store" }));
  });

  it("false khi là khách", async () => {
    mockSession(ok({ user: null }));
    const { result } = renderHook(() => useSignedIn());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("giữ null khi lỗi mạng", async () => {
    const fetchMock = mockSession(Promise.reject(new Error("offline")));
    const { result } = renderHook(() => useSignedIn());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("huỷ request khi unmount", () => {
    const fetchMock = mockSession(new Promise(() => {}));
    const { unmount } = renderHook(() => useSignedIn());
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    unmount();
    expect(init.signal?.aborted).toBe(true);
  });
});
