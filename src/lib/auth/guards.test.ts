/**
 * @jest-environment node
 */
import { routes } from "@/config/routes";
import { requirePermission, requireUser } from "./guards";
import { getSessionUser, type SessionUser } from "./session";

jest.mock("./session", () => ({ getSessionUser: jest.fn() }));

// redirect() của Next dừng render bằng cách ném lỗi — mô phỏng lại để test được nhánh chuyển hướng.
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const mockSession = jest.mocked(getSessionUser);

function makeUser(role: SessionUser["role"]): SessionUser {
  return { id: "u-1", email: "minh.anh@example.com", full_name: "Minh Anh", role, avatar_url: null };
}

describe("requireUser", () => {
  it("chuyển về trang đăng nhập khi là khách (401)", async () => {
    mockSession.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow(`REDIRECT:${routes.login}`);
  });

  it("trả người dùng khi đã đăng nhập", async () => {
    const user = makeUser("user");
    mockSession.mockResolvedValue(user);
    await expect(requireUser()).resolves.toBe(user);
  });
});

describe("requirePermission", () => {
  it("chuyển về đăng nhập trước khi xét quyền nếu là khách", async () => {
    mockSession.mockResolvedValue(null);
    await expect(requirePermission("order:create")).rejects.toThrow(`REDIRECT:${routes.login}`);
  });

  it("chuyển về /403 khi thiếu quyền", async () => {
    mockSession.mockResolvedValue(makeUser("user"));
    await expect(requirePermission("admin:access")).rejects.toThrow(`REDIRECT:${routes.forbidden}`);
  });

  it("cho qua và trả người dùng khi đủ quyền", async () => {
    const admin = makeUser("admin");
    mockSession.mockResolvedValue(admin);
    await expect(requirePermission("admin:access")).resolves.toBe(admin);
  });

  it("lỗi backend (không phải 401/403) được ném tiếp, không bị nuốt", async () => {
    mockSession.mockRejectedValue(new Error("gateway down"));
    await expect(requirePermission("order:own")).rejects.toThrow("gateway down");
  });
});
