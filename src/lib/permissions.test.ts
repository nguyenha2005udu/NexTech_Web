import { can, type Action, type Role } from "./permissions";

// Ma trận mục 10.2 — đổi chính sách phân quyền thì bảng này phải đổi theo.
const GUEST: Action[] = ["catalog:read", "assistant:chat", "cart:manage"];
const USER_ONLY: Action[] = [
  "profile:manage",
  "assistant:history",
  "order:create",
  "order:own",
  "review:create",
  "price-alert:manage",
  "notification:read",
];
const ADMIN_ONLY: Action[] = [
  "admin:access",
  "stats:read",
  "category:manage",
  "product:manage",
  "order:manage",
  "transaction:read",
  "payment:confirm-cod",
  "coupon:manage",
  "user:manage",
];

const EXPECTED: Record<Role, { allowed: Action[]; denied: Action[] }> = {
  guest: { allowed: GUEST, denied: [...USER_ONLY, ...ADMIN_ONLY] },
  user: { allowed: [...GUEST, ...USER_ONLY], denied: ADMIN_ONLY },
  admin: { allowed: [...GUEST, ...USER_ONLY, ...ADMIN_ONLY], denied: [] },
};

describe("can — ma trận phân quyền (mục 10.2)", () => {
  describe.each(Object.entries(EXPECTED) as Array<[Role, (typeof EXPECTED)[Role]]>)("vai trò %s", (role, { allowed, denied }) => {
    it.each(allowed)(`được phép %s`, (action) => {
      expect(can(role, action)).toBe(true);
    });

    if (denied.length) {
      it.each(denied)(`bị chặn %s`, (action) => {
        expect(can(role, action)).toBe(false);
      });
    }
  });

  it("quyền tăng dần: guest ⊂ user ⊂ admin", () => {
    for (const action of [...GUEST, ...USER_ONLY, ...ADMIN_ONLY]) {
      if (can("guest", action)) expect(can("user", action)).toBe(true);
      if (can("user", action)) expect(can("admin", action)).toBe(true);
    }
  });
});
