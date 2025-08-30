import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";
import heroImg from "@/assets/hero.jpg";
import doctor from "@/assets/icons/sthetoscope.svg";
import lab from "@/assets/icons/chemistry.svg";
import pharmacy from "@/assets/icons/medicine.svg";
import ambulance from "@/assets/icons/ambulance.svg";
import Footer from "@/shared/ui/Footer/Footer";

type Item = { key: string; label: string; icon: string };

const items: Item[] = [
  { key: "doctor", label: "Médicos especialistas", icon: doctor },
  { key: "lab", label: "Laboratorios", icon: lab },
  { key: "pharmacy", label: "Farmacia", icon: pharmacy },
  { key: "ambulance", label: "Urgencias 24/7", icon: ambulance },
];

export default function HomePage() {
  return (
    <>
      {/* Topbar de urgencias */}
      <div className={styles.topbar}>
        <div className={`${styles.container} ${styles.topbarInner}`}>
          <strong>Atendemos Urgencias 24h</strong>
          <span className={styles.phone}>
            Llámanos <b>1750</b>
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.grid}`}>
          <div>
            <h1 className={styles.title}>Atención para toda la familia</h1>
            <p className={styles.subtitle}>
              Especialistas · Laboratorios · Urgencias 24/7
            </p>
            <div className={styles.actions}>
              <Link to="/login?next=/dashboard" className={styles.cta}>
                Agendar / Iniciar sesión
              </Link>
            </div>
          </div>
          <div className={styles.media}>
            <img src={heroImg} alt="Atención médica" />
          </div>
        </div>
      </section>

      {/*Servicios*/}
      <section className={styles.services}>
        <div className={styles.container}>
          <h2 className={styles.servicesTitle}>Todo en un mismo lugar</h2>
          <div className={styles.cards}>
            {items.map(({ key, label, icon }) => (
              <div key={key} className={styles.card}>
                <img
                  src={icon}
                  alt=""
                  loading="lazy"
                  width={52}
                  height={52}
                  className={styles.iconImg}
                  aria-hidden="true"
                />
                <div className={styles.label}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
