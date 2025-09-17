ALTER TABLE AntecedentesMedicos
  ADD COLUMN antecedentes TEXT NULL AFTER id_paciente,
  ADD COLUMN alergias TEXT NULL AFTER antecedentes,
  ADD COLUMN enfermedades_cronicas TEXT NULL AFTER alergias,
  ADD COLUMN ultima_actualizacion TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
  AFTER fecha_registro;

ALTER TABLE HistoriasClinicas
  ADD COLUMN tipo_registro ENUM('historia','consulta') NOT NULL DEFAULT 'historia' AFTER numero_historia_clinica,
  ADD COLUMN id_medico INT NULL AFTER id_paciente,
  ADD COLUMN fecha DATETIME NULL AFTER id_medico,
  ADD COLUMN motivo_consulta TEXT NULL AFTER fecha,
  ADD COLUMN diagnostico TEXT NULL AFTER motivo_consulta;

ALTER TABLE HistoriasClinicas
  ADD CONSTRAINT fk_historia_medico
    FOREIGN KEY (id_medico) REFERENCES Medicos(id_medico)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX idx_historia_tipo   ON HistoriasClinicas (tipo_registro);
CREATE INDEX idx_historia_medico ON HistoriasClinicas (id_medico);
CREATE INDEX idx_historia_fecha2 ON HistoriasClinicas (fecha);

ALTER TABLE Imagenologia
  ADD COLUMN categoria ENUM('dpi','resultado','seguro','imagen','otro')
    NOT NULL DEFAULT 'otro' AFTER tipo_imagen,
  ADD COLUMN s3_bucket      VARCHAR(100)  NULL AFTER imagen_url,
  ADD COLUMN s3_key         VARCHAR(512)  NULL AFTER s3_bucket,
  ADD COLUMN content_type   VARCHAR(150)  NULL AFTER s3_key,
  ADD COLUMN tamano_bytes   BIGINT        NULL AFTER content_type,
  ADD COLUMN notas          TEXT          NULL AFTER fecha_estudio,
  ADD COLUMN fecha_documento DATETIME     NULL AFTER notas;

CREATE INDEX idx_img_categoria ON Imagenologia (categoria);

ALTER TABLE Imagenologia
  ADD COLUMN nombre_archivo_original VARCHAR(255) NULL AFTER tamano_bytes;

ALTER TABLE Usuarios
  ADD COLUMN eliminado TINYINT(1) NOT NULL DEFAULT 0 AFTER id_medico,
  ADD COLUMN eliminado_en TIMESTAMP NULL AFTER eliminado,
  ADD COLUMN eliminado_por VARCHAR(100) NULL AFTER eliminado_en;

CREATE INDEX idx_usuarios_no_eliminados ON Usuarios (eliminado);

CREATE TABLE IF NOT EXISTS RefreshTokens (
  id_refresh   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario   INT NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,   -- hash BCrypt del refresh token
  expires_at   DATETIME NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at   DATETIME NULL,
  CONSTRAINT fk_rt_user FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rt_user (id_usuario),
  INDEX idx_rt_valid (expires_at)
);

ALTER TABLE Usuarios
  ADD COLUMN id_paciente INT NULL AFTER id_medico;

CREATE INDEX idx_usuarios_id_paciente ON Usuarios (id_paciente);

ALTER TABLE Usuarios
  ADD CONSTRAINT fk_usuarios_pacientes
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

ALTER TABLE consultasmedicas 
  ADD COLUMN id_cita INT NOT NULL AFTER id_medico,
  ADD CONSTRAINT fk_consultamedica_citasmedicas
    FOREIGN KEY (id_cita) REFERENCES citasmedicas(id_cita)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS CatalogoProcedimientos (
  id_procedimiento_catalogo INT AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)   NOT NULL,
  nombre         VARCHAR(150)  NOT NULL,
  descripcion    TEXT          NULL,
  precio_base    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duracion_min   INT           NULL,
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT uq_catproc_codigo UNIQUE (codigo),
  INDEX idx_catproc_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE ProcedimientosMedicos
  ADD COLUMN id_procedimiento_catalogo INT NOT NULL AFTER id_consulta,
  ADD INDEX idx_proc_catalogo (id_procedimiento_catalogo),
  ADD CONSTRAINT fk_proc_catalogo
    FOREIGN KEY (id_procedimiento_catalogo)
    REFERENCES CatalogoProcedimientos(id_procedimiento_catalogo)
    ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS Tarifas (
  id_tarifa        INT AUTO_INCREMENT PRIMARY KEY,
  id_procedimiento INT           NOT NULL,
  precio           DECIMAL(10,2) NOT NULL,
  INDEX idx_tarifa_procedimiento (id_procedimiento),
  CONSTRAINT fk_tarifa_procedimiento
    FOREIGN KEY (id_procedimiento)
    REFERENCES CatalogoProcedimientos(id_procedimiento_catalogo)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE Usuarios
  MODIFY COLUMN rol ENUM('administrador','medico','recepcionista','paciente') NOT NULL;

ALTER TABLE Facturacion
  ADD COLUMN id_consulta INT NOT NULL AFTER id_paciente,
  ADD INDEX idx_fact_consulta (id_consulta),
  ADD CONSTRAINT fk_fact_consulta
    FOREIGN KEY (id_consulta) REFERENCES ConsultasMedicas(id_consulta)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `citasmedicas`
  MODIFY COLUMN `estado`
  ENUM('confirmada','cancelada','reprogramada','pagada')
  NOT NULL
  DEFAULT 'confirmada';


















