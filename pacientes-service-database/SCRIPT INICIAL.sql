-- ===========================
-- Tabla: Pacientes
-- ===========================
CREATE TABLE IF NOT EXISTS Pacientes (
  id_paciente            INT AUTO_INCREMENT PRIMARY KEY,
  nombres                VARCHAR(150) NOT NULL,
  apellidos              VARCHAR(150) NOT NULL,
  dpi                    VARCHAR(20)  NOT NULL,
  fecha_nacimiento       DATE         NOT NULL,
  sexo                   ENUM('M','F') NOT NULL,
  direccion              VARCHAR(255) NULL,
  telefono               VARCHAR(20)  NULL,
  correo                 VARCHAR(100) NULL,
  estado_civil           VARCHAR(50)  NULL,
  CONSTRAINT uq_pacientes_dpi UNIQUE (dpi),
  INDEX idx_pacientes_nombres   (nombres),
  INDEX idx_pacientes_apellidos (apellidos),
  INDEX idx_pacientes_correo    (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Historias Clínicas
-- ===========================
CREATE TABLE IF NOT EXISTS HistoriasClinicas (
  id_historia_clinica    INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente            INT           NOT NULL,
  numero_historia_clinica VARCHAR(20) NOT NULL,
  fecha_registro         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  descripcion            TEXT          NULL,
  CONSTRAINT fk_historia_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_historia_paciente_numero UNIQUE (id_paciente, numero_historia_clinica),
  INDEX idx_historia_paciente (id_paciente),
  INDEX idx_historia_fecha (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Medicos
-- ===========================
CREATE TABLE IF NOT EXISTS Medicos (
  id_medico          INT AUTO_INCREMENT PRIMARY KEY,
  nombres            VARCHAR(150) NOT NULL,
  apellidos          VARCHAR(150) NOT NULL,
  numero_colegiado   VARCHAR(50)  NULL,
  especialidad       VARCHAR(100) NOT NULL,
  telefono           VARCHAR(20)  NULL,
  correo             VARCHAR(100) NULL,
  horario_laboral    TEXT         NULL,
  CONSTRAINT uq_medicos_num_colegiado UNIQUE (numero_colegiado),
  INDEX idx_medicos_nombres      (nombres),
  INDEX idx_medicos_apellidos    (apellidos),
  INDEX idx_medicos_especialidad (especialidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Usuarios
-- ===========================
CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario   VARCHAR(100)  NOT NULL,
  contrasena       VARCHAR(255)  NOT NULL,
  rol              ENUM('administrador','medico','recepcionista') NOT NULL,
  id_medico        INT           NULL,
  CONSTRAINT uq_usuarios_nombre UNIQUE (nombre_usuario),
  CONSTRAINT fk_usuarios_medicos
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Antecedentes Médicos
-- ===========================
CREATE TABLE IF NOT EXISTS AntecedentesMedicos (
  id_antecedente    INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente       INT           NOT NULL,
  antecedente       VARCHAR(255)  NOT NULL,
  descripcion       TEXT          NULL,
  fecha_registro    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ant_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ant_paciente (id_paciente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Consultas Médicas
-- ===========================
CREATE TABLE IF NOT EXISTS ConsultasMedicas (
  id_consulta       INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente       INT           NOT NULL,
  id_medico         INT           NOT NULL,
  fecha             DATETIME      NOT NULL,
  motivo_consulta   TEXT          NULL,
  diagnostico       TEXT          NULL,
  observaciones     TEXT          NULL,
  CONSTRAINT fk_cons_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cons_medico
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_cons_paciente (id_paciente),
  INDEX idx_cons_medico (id_medico),
  INDEX idx_cons_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Procedimientos Médicos
-- ===========================
CREATE TABLE IF NOT EXISTS ProcedimientosMedicos (
  id_procedimiento  INT AUTO_INCREMENT PRIMARY KEY,
  id_consulta       INT           NOT NULL,
  procedimiento     VARCHAR(255)  NOT NULL,
  descripcion       TEXT          NULL,
  CONSTRAINT fk_proc_consulta
    FOREIGN KEY (id_consulta) REFERENCES ConsultasMedicas(id_consulta)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_proc_consulta (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Recetas Médicas
-- ===========================
CREATE TABLE IF NOT EXISTS RecetasMedicas (
  id_receta     INT AUTO_INCREMENT PRIMARY KEY,
  id_consulta   INT           NOT NULL,
  medicamento   VARCHAR(255)  NOT NULL,
  dosis         VARCHAR(100)  NOT NULL,
  frecuencia    VARCHAR(100)  NOT NULL,
  duracion      VARCHAR(50)   NOT NULL,
  CONSTRAINT fk_rec_consulta
    FOREIGN KEY (id_consulta) REFERENCES ConsultasMedicas(id_consulta)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rec_consulta (id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Imagenología
-- ===========================
CREATE TABLE IF NOT EXISTS Imagenologia (
  id_imagen          INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente        INT           NOT NULL,
  tipo_imagen        VARCHAR(100)  NOT NULL,
  imagen_url         VARCHAR(512)  NOT NULL,
  fecha_estudio      DATE          NOT NULL,
  medico_solicitante INT           NULL,
  CONSTRAINT fk_img_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_img_medico
    FOREIGN KEY (medico_solicitante) REFERENCES Medicos(id_medico)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_img_paciente (id_paciente),
  INDEX idx_img_fecha (fecha_estudio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Citas Médicas
-- ===========================
CREATE TABLE IF NOT EXISTS CitasMedicas (
  id_cita           INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente       INT           NOT NULL,
  id_medico         INT           NOT NULL,
  fecha             DATETIME      NOT NULL,
  estado            ENUM('confirmada','cancelada','reprogramada') NOT NULL DEFAULT 'confirmada',
  razon_cancelacion TEXT          NULL,
  CONSTRAINT fk_cita_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cita_medico
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_cita_medico_fecha UNIQUE (id_medico, fecha),
  INDEX idx_cita_paciente (id_paciente),
  INDEX idx_cita_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Facturación
-- ===========================
CREATE TABLE IF NOT EXISTS Facturacion (
  id_factura     INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente    INT           NOT NULL,
  fecha_emision  DATE          NOT NULL,
  monto_total    DECIMAL(10,2) NOT NULL,
  estado_pago    ENUM('pendiente','pagado','cancelado') NOT NULL DEFAULT 'pendiente',
  tipo_pago      ENUM('efectivo','tarjeta','debito')     NOT NULL,
  CONSTRAINT fk_fact_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_fact_paciente (id_paciente),
  INDEX idx_fact_fecha (fecha_emision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Pagos
-- ===========================
CREATE TABLE IF NOT EXISTS Pagos (
  id_pago      INT AUTO_INCREMENT PRIMARY KEY,
  id_factura   INT           NOT NULL,
  monto        DECIMAL(10,2) NOT NULL,
  fecha_pago   DATE          NOT NULL,
  metodo_pago  ENUM('efectivo','tarjeta','debito') NOT NULL,
  CONSTRAINT fk_pago_factura
    FOREIGN KEY (id_factura) REFERENCES Facturacion(id_factura)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_pago_factura (id_factura),
  INDEX idx_pago_fecha (fecha_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================
-- Tabla: Contactos de Emergencia
-- ===========================
CREATE TABLE IF NOT EXISTS ContactosEmergencia (
  id_contacto         INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente         INT           NOT NULL,
  nombre              VARCHAR(150)  NOT NULL,
  parentesco          VARCHAR(100)  NOT NULL,
  telefono            VARCHAR(20)   NOT NULL,
  CONSTRAINT fk_contacto_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_contacto_paciente (id_paciente),
  INDEX idx_contacto_nombre   (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;