ALTER TABLE `citasmedicas`
  MODIFY COLUMN `estado`
  ENUM('confirmada','cancelada','reprogramada','pagada')
  NOT NULL
  DEFAULT 'confirmada';