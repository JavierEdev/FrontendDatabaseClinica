import LoginForm from "@/features/auth/ui/LoginForm/LoginForm";
import styles from "@/features/auth/ui/LoginForm/LoginForm.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
