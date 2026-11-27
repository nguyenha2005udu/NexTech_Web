// Ảnh đại diện, hoặc chữ cái đầu của tên khi chưa có ảnh (design/admin/07 §1.3, §2.1).
import { Avatar } from "antd";

export function UserAvatar({ name, src, size }: Readonly<{ name: string; src: string | null; size?: number }>) {
  return (
    <Avatar src={src ?? undefined} size={size} alt={name}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </Avatar>
  );
}
