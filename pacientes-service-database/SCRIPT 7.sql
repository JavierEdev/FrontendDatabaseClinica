-- 1) Columna opcional para vincular a Pacientes
ALTER TABLE Usuarios
  ADD COLUMN id_paciente INT NULL AFTER id_medico;

-- 2) (Opcional) Índice para búsquedas por paciente
CREATE INDEX idx_usuarios_id_paciente ON Usuarios (id_paciente);

-- 3) Llave foránea: si borran el paciente, queda en NULL
ALTER TABLE Usuarios
  ADD CONSTRAINT fk_usuarios_pacientes
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
