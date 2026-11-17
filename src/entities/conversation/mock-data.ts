import type { ChatMessage, Conversation } from "./types";

// Dữ liệu minh hoạ lấy từ Figma 02.02–02.05. Thay bằng API backend khi có hợp đồng.
export const laptopItMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    text: "Mình học IT, cần laptop văn phòng nhẹ, ngân sách khoảng 16 triệu.",
  },
  {
    id: "m2",
    role: "assistant",
    text: "Với ngân sách này, bạn nên ưu tiên RAM 16 GB và SSD 512 GB để chạy IDE, máy ảo nhẹ và nhiều tab cùng lúc. Mình gợi ý hai mẫu bên dưới, bạn xem chi tiết nhé.",
    productSlugs: ["asus-vivobook-15", "lenovo-ideapad-slim-5"],
  },
];

export const mockConversations: Conversation[] = [
  { id: "laptop-hoc-it", title: "Laptop học IT dưới 16 triệu", updatedLabel: "Hôm nay", messages: laptopItMessages },
  {
    id: "man-hinh-thiet-ke",
    title: "Màn hình cho thiết kế",
    updatedLabel: "Hôm qua",
    messages: [
      { id: "m1", role: "user", text: "Mình cần màn hình cho thiết kế đồ họa, ngân sách khoảng 8 triệu." },
      { id: "m2", role: "assistant", text: "Bạn nên chọn màn hình IPS độ phủ màu sRGB cao, độ phân giải từ 2K trở lên." },
    ],
  },
  {
    id: "nang-cap-pc-gaming",
    title: "Nâng cấp PC chơi game",
    updatedLabel: "3 ngày trước",
    messages: [
      { id: "m1", role: "user", text: "Mình muốn nâng cấp PC chơi game, nên đổi linh kiện nào trước?" },
      { id: "m2", role: "assistant", text: "Thường card đồ họa và RAM cho hiệu quả rõ nhất. Bạn cho mình biết cấu hình hiện tại nhé." },
    ],
  },
];
