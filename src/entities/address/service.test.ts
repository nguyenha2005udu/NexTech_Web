/** @jest-environment node */
import { addressService } from "./service";

describe("addressService", () => {
  it("đưa địa chỉ mặc định lên đầu", async () => {
    const list = await addressService.listMine();
    expect(list[0]?.is_default).toBe(true);
    expect(list.filter((a) => a.is_default)).toHaveLength(1);
  });

  it("getMine trả null khi id không thuộc sổ địa chỉ", async () => {
    expect(await addressService.getMine("addr-home")).toMatchObject({ label: "Nhà riêng" });
    expect(await addressService.getMine("addr-cua-nguoi-khac")).toBeNull();
  });
});
