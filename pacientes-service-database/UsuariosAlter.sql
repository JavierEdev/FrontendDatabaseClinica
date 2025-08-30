ALTER TABLE Usuarios
  ADD COLUMN eliminado TINYINT(1) NOT NULL DEFAULT 0 AFTER id_medico,
  ADD COLUMN eliminado_en TIMESTAMP NULL AFTER eliminado,
  ADD COLUMN eliminado_por VARCHAR(100) NULL AFTER eliminado_en;

-- Opcional: índice para filtrar rápido los activos
CREATE INDEX idx_usuarios_no_eliminados ON Usuarios (eliminado);
