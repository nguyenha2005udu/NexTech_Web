"use client";

// FDD 7.1 — Bảng danh mục (design/admin/02 §1.3–1.4). "Ẩn" = xoá mềm (✅Q-C1); danh mục đã ẩn chỉ còn "Sửa".
import Image from "next/image";
import { App, Button, Popconfirm, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import type { AdminCategory } from "@/entities/category";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDate } from "@/lib/format";
import { hideCategory } from "../actions";
import { isImageIcon } from "../category.rules";
import styles from "./categories.module.css";

function CategoryIcon({ icon }: Readonly<{ icon: string | null }>) {
  if (icon && isImageIcon(icon)) {
    // URL tuỳ ý do admin nhập → không qua Image Optimization nên không cần khai báo remotePatterns
    return <Image src={icon.trim()} alt="" width={24} height={24} unoptimized className={styles.iconImage} />;
  }
  return icon?.trim() ? <span className={styles.iconCell}>{icon}</span> : <span className={styles.muted}>—</span>;
}

function RowActions({ category }: Readonly<{ category: AdminCategory }>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  async function confirmHide() {
    const result = await hideCategory(category.id);
    if (result.ok) message.success("Đã ẩn danh mục");
    else message.warning(result.message);
  }

  return (
    <span className={styles.actions}>
      <Button type="link" className={styles.linkButton} onClick={() => setParams({ modal: "edit", id: category.id })}>
        Sửa
      </Button>
      {category.isActive && (
        <Popconfirm
          title={`Ẩn danh mục “${category.name}”?`}
          description="Danh mục sẽ không hiện ở trang bán hàng."
          okText="Ẩn"
          cancelText="Huỷ"
          onConfirm={confirmHide}
        >
          <Button type="link" danger className={styles.linkButton}>
            Ẩn
          </Button>
        </Popconfirm>
      )}
    </span>
  );
}

const columns: TableColumnsType<AdminCategory> = [
  { title: "ICON", dataIndex: "icon", key: "icon", width: 80, render: (icon: string | null) => <CategoryIcon icon={icon} /> },
  { title: "TÊN", dataIndex: "name", key: "name" },
  { title: "THỨ TỰ", dataIndex: "sortOrder", key: "sortOrder", width: 100 },
  {
    title: "TRẠNG THÁI",
    dataIndex: "isActive",
    key: "isActive",
    width: 130,
    render: (isActive: boolean) =>
      isActive ? (
        <Tag color="green" variant="solid">
          Hiển thị
        </Tag>
      ) : (
        <Tag color="#8c8c8c">Ẩn</Tag>
      ),
  },
  {
    title: "NGÀY TẠO",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 140,
    render: (iso: string) => <span className={styles.muted}>{formatDate(iso)}</span>,
  },
  {
    title: "THAO TÁC",
    key: "actions",
    align: "right",
    width: 120,
    render: (_: unknown, category) => <RowActions category={category} />,
  },
];

export interface CategoryTableProps {
  items: AdminCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export function CategoryTable({ items, total, page, pageSize }: Readonly<CategoryTableProps>) {
  const { setParams } = useAdminListParams();

  return (
    <Table<AdminCategory>
      rowKey="id"
      columns={columns}
      dataSource={items}
      size="middle"
      sticky
      scroll={{ x: 720, y: "calc(100vh - 260px)" }}
      locale={{ emptyText: "Không có dữ liệu phù hợp" }}
      pagination={
        total > pageSize && {
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          onChange: (next) => setParams({ page: next }),
        }
      }
    />
  );
}
