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