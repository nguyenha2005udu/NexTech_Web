// FDD 1.2.1 — Thông tin cá nhân. SSR: dữ liệu riêng của người dùng (mục 5).
import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { userService } from "@/entities/user/service";
import { requirePermission } from "@/lib/auth/guards";
import { ProfileForm, profileStyles } from "@/features/profile";

export const metadata: Metadata = {
  title: "Thông tin cá nhân",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requirePermission("profile:manage");
  const profile = await userService.getMine();

  return (
    <main className={profileStyles.wrap}>
      <Breadcrumbs items={[{ label: "Trang chủ", href: routes.home }, { label: "Thông tin cá nhân" }]} />
      <div>
        <h1 className={profileStyles.title}>Thông tin cá nhân</h1>
        <p className={profileStyles.subtitle}>Cập nhật hồ sơ để NexTech tư vấn đúng nhu cầu của bạn.</p>
      </div>
      <ProfileForm profile={profile} />
    </main>
  );
}
