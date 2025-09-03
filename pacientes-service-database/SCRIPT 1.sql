ALTER TABLE AntecedentesMedicos
  ADD COLUMN antecedentes TEXT NULL AFTER id_paciente,
  ADD COLUMN alergias TEXT NULL AFTER antecedentes,
  ADD COLUMN enfermedades_cronicas TEXT NULL AFTER alergias,
  ADD COLUMN ultima_actualizacion TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
  AFTER fecha_registro;