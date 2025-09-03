ALTER TABLE Facturacion
  ADD COLUMN id_consulta INT NOT NULL AFTER id_paciente,
  ADD INDEX idx_fact_consulta (id_consulta),
  ADD CONSTRAINT fk_fact_consulta
    FOREIGN KEY (id_consulta) REFERENCES ConsultasMedicas(id_consulta)
    ON UPDATE CASCADE ON DELETE RESTRICT;