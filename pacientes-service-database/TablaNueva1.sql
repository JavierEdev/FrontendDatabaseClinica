CREATE TABLE IF NOT EXISTS RefreshTokens (
  id_refresh   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario   INT NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,   -- hash BCrypt del refresh token
  expires_at   DATETIME NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at   DATETIME NULL,
  CONSTRAINT fk_rt_user FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rt_user (id_usuario),
  INDEX idx_rt_valid (expires_at)
);