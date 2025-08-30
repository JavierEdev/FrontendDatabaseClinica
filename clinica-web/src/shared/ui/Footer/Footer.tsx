import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Columna 1: Logo y descripción */}
        <div className={styles.col}>
          <h2 className={styles.logo}>ClínicaWeb</h2>
          <p>
            Brindamos atención médica integral con especialistas, laboratorio,
            farmacia y urgencias 24/7.
          </p>
        </div>

        {/* Columna 2: Links rápidos */}
        <div className={styles.col}>
          <h4>Servicios</h4>
          <ul>
            <li><Link to="/doctores">Médicos</Link></li>
            <li><Link to="/laboratorios">Laboratorios</Link></li>
            <li><Link to="/farmacia">Farmacia</Link></li>
            <li><Link to="/urgencias">Urgencias</Link></li>
          </ul>
        </div>

        {/* Columna 3: Contacto */}
        <div className={styles.col}>
          <h4>Contáctanos</h4>
          <p>📍 5a Avenida 10-50, Zona 1</p>
          <p>📞 (502) 2222-3333</p>
          <p>✉️ contacto@clinicaweb.com</p>
        </div>

        {/* Columna 4: Redes sociales */}
        <div className={styles.col}>
          <h4>Síguenos</h4>
          <div className={styles.socials}>
            <a href="#">🌐 Facebook</a>
            <a href="#">🌐 Instagram</a>
            <a href="#">🌐 Twitter</a>
          </div>
        </div>
      </div>

      <div className={styles.copy}>
        <p>© {new Date().getFullYear()} ClínicaWeb. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
