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
