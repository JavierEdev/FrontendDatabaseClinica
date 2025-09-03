<<<<<<< HEAD
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



=======
CREATE TABLE IF NOT EXISTS Tarifas (
  id_tarifa         INT AUTO_INCREMENT PRIMARY KEY,
  procedimiento  	VARCHAR(255) NOT NULL,
  precio            DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Tarifas (procedimiento, precio)
VALUES
('Electrocardiograma', 350.00),  -- Electrocardiograma
('Examen de sangre', 150.00),  -- Examen de sangre
('Endoscopía', 800.00);  -- Endoscopía
>>>>>>> 492d2f9 (Adding new scripting files)
