import { orFallbackAtBuild } from "./build-safe";

describe("orFallbackAtBuild", () => {
  const original = process.env.NEXT_PHASE;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = original;
  });

  it("trả kết quả thật khi gọi thành công", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    await expect(orFallbackAtBuild(async () => [1, 2], [])).resolves.toEqual([1, 2]);
  });

  it("dùng giá trị dự phòng khi lỗi ở pha build", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    await expect(orFallbackAtBuild(() => Promise.reject(new Error("503")), [])).resolves.toEqual([]);
  });

  it("vẫn ném lỗi khi chạy thật để Next giữ trang cũ", async () => {
    process.env.NEXT_PHASE = "phase-production-server";
    await expect(orFallbackAtBuild(() => Promise.reject(new Error("503")), [])).rejects.toThrow("503");
  });
});
