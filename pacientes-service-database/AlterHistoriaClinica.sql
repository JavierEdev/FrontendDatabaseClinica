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