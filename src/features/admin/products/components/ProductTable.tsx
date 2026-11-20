"use client";

// FDD 7.2 — Bảng sản phẩm (design/admin/03 §1.3–1.5). Header dính + thân cuộn (yêu cầu reviewer trên ảnh 04),
// sắp xếp GIÁ / RATING phía server qua ?sort= (✅Q-P5), cột TỒN KHO (✅Q-P1), "Xoá" là xoá cứng (✅Q-P2).
import Image from "next/image";
import { App, Button, Popconfirm, Table, Tag } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import type { AdminProductListItem, AdminProductSort } from "@/entities/product";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatNumber, formatRating, formatVND } from "@/lib/format";
import { deleteProduct } from "../actions";
import {
  PRODUCT_PAGE_SIZES,
  columnSortOrder,
  sortFromTable,
  stockLevel,
  type SortableColumn,
} from "../product.rules";
import styles from "./products.module.css";

function Thumbnail({ src }: Readonly<{ src: string | null }>) {
  // URL ảnh do admin dán / Cloudinary — không qua Image Optimization nên không cần remotePatterns
  return src ? (
    <Image src={src} alt="" width={32} height={32} unoptimized className={styles.thumb} />
  ) : (
    <span className={styles.thumbPlaceholder} aria-hidden="true" />
  );
}

function Stock({ quantity }: Readonly<{ quantity: number }>) {
  const level = stockLevel(quantity);
  if (level === "out") return <span className={styles.stockLow}>Hết hàng</span>;
  return <span className={level === "low" ? styles.stockLow : undefined}>{formatNumber(quantity)}</span>;
}

function RowActions({ product }: Readonly<{ product: AdminProductListItem }>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();

  async function confirmDelete() {
    const result = await deleteProduct(product.id);
    if (result.ok) message.success("Đã xoá sản phẩm");
    else message.warning(result.message);
  }

  return (
    <span className={styles.actions}>
      <Button type="link" className={styles.linkButton} onClick={() => setParams({ modal: "edit", id: product.id })}>
        Sửa
      </Button>
      <Popconfirm
        title={`Xoá sản phẩm “${product.name}”?`}
        description="Ảnh của sản phẩm cũng bị xoá, không hoàn tác được."
        okText="Xoá"
        okButtonProps={{ danger: true }}
        cancelText="Huỷ"
        onConfirm={confirmDelete}
      >
        <Button type="link" danger className={styles.linkButton}>
          Xoá
        </Button>
      </Popconfirm>
    </span>
  );
}

function buildColumns(sort: AdminProductSort | undefined): TableColumnsType<AdminProductListItem> {
  return [
    {
      title: "ẢNH",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 64,
      render: (src: string | null) => <Thumbnail src={src} />,
    },
    { title: "TÊN", dataIndex: "name", key: "name", width: 260, ellipsis: true },
    {
      title: "THƯƠNG HIỆU",
      dataIndex: "brand",
      key: "brand",
      width: 130,
      render: (brand: string | null) => brand ?? <span className={styles.muted}>—</span>,
    },
    {
      title: "DANH MỤC",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category: string | null) => <span className={styles.muted}>{category ?? "—"}</span>,
    },
    {
      title: "GIÁ",
      dataIndex: "price",
      key: "price" satisfies SortableColumn,
      width: 140,
      sorter: true,
      sortDirections: ["ascend", "descend"],
      sortOrder: columnSortOrder(sort, "price"),
      render: (price: number) => <span className={styles.money}>{formatVND(price)}</span>,
    },
    {
      title: "RATING",
      dataIndex: "rating",
      key: "rating" satisfies SortableColumn,
      width: 110,
      sorter: true,
      sortDirections: ["descend"], // API chỉ có rating_desc
      sortOrder: columnSortOrder(sort, "rating"),
      render: (rating: string | null) =>
        rating === null ? <span className={styles.muted}>—</span> : <span className={styles.rating}>★ {formatRating(Number(rating))}</span>,
    },
    {
      title: "TỒN KHO",
      dataIndex: "stock_quantity",
      key: "stock_quantity",
      width: 100,
      render: (quantity: number) => <Stock quantity={quantity} />,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (active: boolean) =>
        active ? (
          <Tag color="green" variant="solid">
            Đang bán
          </Tag>
        ) : (
          <Tag color="#8c8c8c">Ngừng bán</Tag>
        ),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right",
      width: 110,
      fixed: "right",
      render: (_: unknown, product) => <RowActions product={product} />,
    },
  ];
}

export interface ProductTableProps {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  sort: AdminProductSort | undefined;
}

export function ProductTable({ items, total, page, pageSize, sort }: Readonly<ProductTableProps>) {
  const { setParams } = useAdminListParams();

  const onChange: TableProps<AdminProductListItem>["onChange"] = (pagination, _filters, sorter, extra) => {
    if (extra.action === "sort") {
      const s = Array.isArray(sorter) ? sorter[0] : sorter;
      setParams({ sort: sortFromTable(s?.columnKey as SortableColumn | undefined, s?.order ?? null) });
      return;
    }
    if (extra.action === "paginate") {
      // Đổi số dòng/trang → về trang 1 (useAdminListParams xoá `page` khi đổi tham số không phải UI)
      if (pagination.pageSize && pagination.pageSize !== pageSize) setParams({ size: pagination.pageSize });
      else setParams({ page: pagination.current });
    }
  };

  return (
    <Table<AdminProductListItem>
      rowKey="id"
      columns={buildColumns(sort)}
      dataSource={items}
      size="middle"
      sticky
      scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}
      locale={{ emptyText: "Không có dữ liệu phù hợp" }}
      showSorterTooltip={false}
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: PRODUCT_PAGE_SIZES.map(String),
        hideOnSinglePage: total <= PRODUCT_PAGE_SIZES[0],
        showTotal: (n) => `${formatNumber(n)} sản phẩm`,
      }}
    />
  );
}
