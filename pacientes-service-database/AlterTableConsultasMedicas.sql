ALTER TABLE consultasmedicas 
  ADD COLUMN id_cita INT NOT NULL AFTER id_medico,
  ADD CONSTRAINT fk_consultamedica_citasmedicas
    FOREIGN KEY (id_cita) REFERENCES citasmedicas(id_cita)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

