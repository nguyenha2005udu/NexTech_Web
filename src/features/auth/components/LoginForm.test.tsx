import { screen, waitFor } from "@testing-library/react";
import { renderWithAntd, setupUser } from "@/lib/test-utils";
import { loginWithEmail } from "../actions";
import { LoginForm } from "./LoginForm";

const replace = jest.fn();
const refresh = jest.fn();
let callbackUrl: string | null = null;
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => ({ get: (name: string) => (name === "callbackUrl" ? callbackUrl : null) }),
}));
jest.mock("../actions", () => ({ loginWithEmail: jest.fn() }));
const mockLogin = jest.mocked(loginWithEmail);

async function submitValidLogin() {
  const user = setupUser();
  renderWithAntd(<LoginForm />);
  await user.type(screen.getByPlaceholderText("email@example.com"), "user@x.com");
  await user.type(screen.getByPlaceholderText("Mật khẩu"), "Passw0rd1");
  await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
}

beforeEach(() => {
  callbackUrl = null;
  mockLogin.mockResolvedValue({ ok: true });
});
afterEach(() => jest.clearAllMocks());

describe("LoginForm — chuyển trang sau khi đăng nhập", () => {
  it("quay về callbackUrl nội bộ rồi làm mới phiên", async () => {
    callbackUrl = "/account/orders?status=pending";
    await submitValidLogin();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/account/orders?status=pending"));
    expect(refresh).toHaveBeenCalled();
  });

  it("không có callbackUrl thì về trang chủ", async () => {
    await submitValidLogin();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it.each(["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com", "/a/../..//evil.com"])(
    "callbackUrl độc hại %j thì về trang chủ, không rời web",
    async (evil) => {
      callbackUrl = evil;
      await submitValidLogin();
      await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
      expect(replace).not.toHaveBeenCalledWith(evil);
    },
  );

  it("đăng nhập thất bại thì ở lại trang, không chuyển hướng", async () => {
    callbackUrl = "/account/orders";
    mockLogin.mockResolvedValue({ ok: false, message: "Email hoặc mật khẩu không đúng" });
    await submitValidLogin();
    expect(await screen.findByText("Email hoặc mật khẩu không đúng")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
