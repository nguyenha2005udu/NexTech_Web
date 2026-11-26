import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./error";
import GlobalError from "./global-error";

jest.mock("@/features/auth", () => ({
  AuthBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AuthFooter: ({ linkLabel }: { linkLabel: string }) => <p>{linkLabel}</p>,
  AuthHeading: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
jest.mock("@/components/layout/AuthShell", () => ({ AuthShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe("error boundary", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("hiện thông báo lỗi thân thiện, không lộ nội dung lỗi", () => {
    render(<ErrorBoundary error={new Error("secret db password")} reset={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "Đã có lỗi xảy ra" })).toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });

  it("ghi lỗi ra console và 'Thử lại' gọi reset", async () => {
    const reset = jest.fn();
    const error = new Error("boom");
    render(<ErrorBoundary error={error} reset={reset} />);
    expect(console.error).toHaveBeenCalledWith(error);
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("global error", () => {
  it("'Thử lại' gọi reset", async () => {
    const reset = jest.fn();
    // <html> lồng trong <div> của RTL gây cảnh báo DOM nesting; chỉ kiểm hành vi nút.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<GlobalError error={new Error("x")} reset={reset} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
