"use client";

// FDD 8.3 — Bảng mã giảm giá (design/admin/05 §1.3–1.4). Nhãn trạng thái tách theo ✅Q-CP1;
// "Xoá" của mockup đổi thành "Tạm dừng" / "Kích hoạt" (✅Q-CP2). `now` lấy ở server để không lệch hydration.
import { App, Button, Popconfirm, Table, Tag } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { COUPON_STATUS_META, couponDisplayStatus, type AdminCoupon } from "@/entities/coupon";
import { useAdminListParams } from "@/hooks/useAdminListParams";
import { formatDate, formatNumber } from "@/lib/format";
import { toggleCoupon } from "../actions";
import { formatCouponUsage, formatCouponValue } from "../coupon.rules";
import styles from "./coupons.module.css";

function RowActions({ coupon }: Readonly<{ coupon: AdminCoupon }>) {
  const { setParams } = useAdminListParams();
  const { message } = App.useApp();
  const activate = !coupon.is_active;

  async function confirm() {
    const result = await toggleCoupon(coupon.id, activate);
    if (result.ok) message.success(activate ? "Đã kích hoạt mã" : "Đã tạm dừng mã");
    else message.warning(result.message);
  }

  return (
    <span className={styles.actions}>
      <Button type="link" className={styles.linkButton} onClick={() => setParams({ modal: "edit", id: coupon.id })}>
        Sửa
      </Button>
      <Popconfirm
        title={activate ? `Kích hoạt lại mã ${coupon.code}?` : `Tạm dừng mã ${coupon.code}?`}
        description={activate ? undefined : "Khách sẽ không dùng được mã này."}
        okText={activate ? "Kích hoạt" : "Tạm dừng"}
        cancelText="Huỷ"
        onConfirm={confirm}
      >
        {activate ? (
          <Button type="link" className={`${styles.linkButton} ${styles.activate}`}>
            Kích hoạt
          </Button>
        ) : (
          <Button type="link" danger className={styles.linkButton}>
            Tạm dừng
          </Button>
        )}
      </Popconfirm>
    </span>
  );
}

function buildColumns(now: Date): TableColumnsType<AdminCoupon> {
  return [
    {
      title: "MÃ",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string) => <span className={styles.code}>{code}</span>,
    },
    {
      title: "MÔ TẢ",
      dataIndex: "description",
      key: "description",
      width: 240,
      ellipsis: true,
      render: (description: string | null) => <span className={styles.muted}>{description ?? "—"}</span>,
    },
    {
      title: "LOẠI",
      dataIndex: "discount_type",
      key: "discount_type",
      width: 70,
      render: (type: AdminCoupon["discount_type"]) => (type === "percent" ? "%" : "₫"),
    },
    {
      title: "GIÁ TRỊ",
      key: "value",
      width: 120,
      render: (_: unknown, coupon) => <span className={styles.value}>{formatCouponValue(coupon)}</span>,
    },
    {
      title: "ĐÃ DÙNG",
      key: "usage",
      width: 110,
      render: (_: unknown, coupon) => <span className={styles.nowrap}>{formatCouponUsage(coupon)}</span>,
    },
    {
      title: "HSD",
      dataIndex: "valid_until",
      key: "valid_until",
      width: 120,
      render: (iso: string | null) => <span className={styles.muted}>{iso ? formatDate(iso) : "Không hạn"}</span>,
    },
    {
      title: "TRẠNG THÁI",
      key: "status",
      width: 130,
      render: (_: unknown, coupon) => {
        const meta = COUPON_STATUS_META[couponDisplayStatus(coupon, now)];
        return (
          <Tag color={meta.color} variant="solid">
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "THAO TÁC",
      key: "actions",
      align: "right",
      width: 150,
      fixed: "right",
      render: (_: unknown, coupon) => <RowActions coupon={coupon} />,
    },
  ];
}

export interface CouponTableProps {
  items: AdminCoupon[];
  total: number;
  page: number;
  pageSize: number;
  /** Thời điểm render ở server (ISO). */
  now: string;
}

export function CouponTable({ items, total, page, pageSize, now }: Readonly<CouponTableProps>) {
  const { setParams } = useAdminListParams();

  const onChange: TableProps<AdminCoupon>["onChange"] = (pagination, _filters, _sorter, extra) => {
    if (extra.action === "paginate") setParams({ page: pagination.current });
  };

  return (
    <Table<AdminCoupon>
      rowKey="id"
      columns={buildColumns(new Date(now))}
      dataSource={items}
      size="middle"
      sticky
      scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}
      locale={{ emptyText: "Không có dữ liệu phù hợp" }}
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        hideOnSinglePage: true,
        showTotal: (n) => `${formatNumber(n)} mã`,
      }}
    />
  );
}
