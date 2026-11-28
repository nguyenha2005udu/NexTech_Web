import { makeProduct } from "@/lib/test-utils";
import {
  META_DESCRIPTION_MAX,
  productDescription,
  productJsonLd,
  productMetaDescription,
  truncateDescription,
} from "./seo";

/** Dạng JSON-LD Product dùng trong test (chỉ các trường được kiểm). */
interface ProductLd {
  "@type": string;
  description: string;
  brand?: { "@type": string; name: string };
  image?: string[];
  aggregateRating?: { "@type": string; ratingValue: number; reviewCount: number };
  offers: { "@type": string; priceCurrency: string; price: number; availability: string; url: string };
}
const ld = (product: Parameters<typeof productJsonLd>[0]) => productJsonLd(product) as unknown as ProductLd;

const bare = (over: Parameters<typeof makeProduct>[0] = {}) =>
  makeProduct({ name: "Tai nghe NexTech Basic", brand: "NexTech", price: 200_000, headline: "", description: undefined, ...over });

describe("truncateDescription", () => {
  it("ngắn hơn giới hạn thì giữ nguyên, gộp khoảng trắng và xuống dòng", () => {
    expect(truncateDescription("  Màn hình  OLED\n\n14 inch ")).toBe("Màn hình OLED 14 inch");
  });

  it("dài hơn giới hạn thì cắt ở ranh giới từ, thêm … và không vượt giới hạn", () => {
    const long = "Laptop mỏng nhẹ cấu hình mạnh ".repeat(20);
    const result = truncateDescription(long);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/\s…$/);
    expect(long.replace(/\s+/g, " ")).toContain(result.slice(0, -1));
  });

  it("không có khoảng trắng để cắt thì cắt cứng đúng giới hạn", () => {
    const result = truncateDescription("x".repeat(500));
    expect(result).toHaveLength(META_DESCRIPTION_MAX);
    expect(result.endsWith("…")).toBe(true);
  });

  it("đúng bằng giới hạn thì không cắt", () => {
    const exact = "a".repeat(META_DESCRIPTION_MAX);
    expect(truncateDescription(exact)).toBe(exact);
  });
});

describe("productDescription / productMetaDescription", () => {
  it("ưu tiên mô tả của backend", () => {
    expect(productDescription(bare({ description: "Tai nghe chống ồn chủ động.", headline: "BT 5.3" }))).toBe("Tai nghe chống ồn chủ động.");
  });

  it("không có mô tả thì dùng dòng cấu hình", () => {
    expect(productDescription(bare({ headline: "BT 5.3 · 30 giờ" }))).toBe("BT 5.3 · 30 giờ");
  });

  it("backend không có mô tả lẫn cấu hình (null) thì dựng câu từ tên, hãng và giá — không bao giờ rỗng", () => {
    const text = productDescription(bare());
    expect(text).toContain("Tai nghe NexTech Basic");
    expect(text).toContain("NexTech");
    expect(text).toContain("200.000");
    expect(text.trim()).not.toBe("");
  });

  it("chuỗi chỉ có khoảng trắng coi như không có", () => {
    expect(productDescription(bare({ description: "   \n ", headline: "  " }))).toContain("Tai nghe NexTech Basic");
  });

  it("không có hãng thì câu dựng không có 'của '", () => {
    expect(productDescription(bare({ brand: "" }))).not.toContain("của");
  });

  it("meta description bị cắt còn tối đa 160 ký tự, JSON-LD vẫn giữ nguyên bản đầy đủ", () => {
    const long = "Mô tả rất dài về chiếc tai nghe này. ".repeat(20);
    expect(productMetaDescription(bare({ description: long })).length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(productDescription(bare({ description: long })).length).toBeGreaterThan(META_DESCRIPTION_MAX);
  });
});

describe("productJsonLd", () => {
  const full = bare({
    description: "Tai nghe chống ồn.",
    rating: 4.5,
    reviewCount: 12,
    images: [{ src: "https://res.cloudinary.com/demo/a.jpg", alt: "a" }],
  });

  it("có đủ dữ liệu: Product + Offer + aggregateRating + ảnh + hãng", () => {
    const out = ld(full);
    expect(out["@type"]).toBe("Product");
    expect(out.description).toBe("Tai nghe chống ồn.");
    expect(out.brand).toEqual({ "@type": "Brand", name: "NexTech" });
    expect(out.image).toEqual(["https://res.cloudinary.com/demo/a.jpg"]);
    expect(out.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 12 });
    expect(out.offers).toMatchObject({ "@type": "Offer", priceCurrency: "VND", price: 200_000, availability: "https://schema.org/InStock" });
    expect(out.offers.url).toMatch(/\/products\//);
  });

  it("chưa có đánh giá thì BỎ aggregateRating (0 sao / 0 đánh giá là không hợp lệ)", () => {
    expect("aggregateRating" in productJsonLd({ ...full, rating: 0, reviewCount: 0 })).toBe(false);
  });

  it("có đánh giá nhưng backend chưa tính sao trung bình (rating 0) thì cũng bỏ, không điền 0", () => {
    expect("aggregateRating" in productJsonLd({ ...full, rating: 0, reviewCount: 3 })).toBe(false);
  });

  it("điểm ngoài khoảng 1–5 thì bỏ", () => {
    expect("aggregateRating" in productJsonLd({ ...full, rating: 7, reviewCount: 3 })).toBe(false);
  });

  it("không có hãng thì bỏ brand; không có ảnh thì bỏ image", () => {
    const out = productJsonLd({ ...full, brand: "", images: [] });
    expect("brand" in out).toBe(false);
    expect("image" in out).toBe(false);
  });

  it("description luôn có nội dung dù backend không có mô tả", () => {
    expect(String(productJsonLd(bare()).description).length).toBeGreaterThan(10);
  });

  it("hết hàng thì availability là OutOfStock", () => {
    expect(ld({ ...full, inStock: false }).offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("ảnh tương đối được đổi thành URL tuyệt đối", () => {
    const out = ld({ ...full, images: [{ src: "/img/a.jpg", alt: "a" }] });
    expect(out.image?.[0]).toMatch(/^https?:\/\/.+\/img\/a\.jpg$/);
  });
});
