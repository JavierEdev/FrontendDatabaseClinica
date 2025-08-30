import { Outlet } from "react-router-dom";
import Sidebar from "@/features/admin/ui/sidebar/Sidebar";
import styles from "./admin-layout.module.css";

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
