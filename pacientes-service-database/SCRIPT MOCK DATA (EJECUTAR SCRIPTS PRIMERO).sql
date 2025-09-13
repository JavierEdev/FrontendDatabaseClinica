##MOCK DATA

$##Catalogos Mock
INSERT INTO CatalogoProcedimientos
  (codigo, nombre, descripcion, precio_base, duracion_min, activo)
VALUES
  ('CONS-GEN',   'Consulta general',                   'Evaluación médica inicial',                         150.00, 30, 1),
  ('CONS-CONT',  'Consulta de control',                'Seguimiento de tratamiento',                        100.00, 20, 1),
  ('LAB-CBC',    'Hemograma completo (CBC)',           'Recuento y fórmula sanguínea',                       95.00, NULL, 1),
  ('LAB-GLU',    'Glucosa en sangre',                  'Determinación de glucosa',                           35.00, NULL, 1),
  ('LAB-LIP',    'Perfil lipídico',                    'Colesterol total, HDL, LDL, triglicéridos',         180.00, NULL, 1),
  ('LAB-URI',    'Examen general de orina (EGO)',      'Parámetros físicos y químicos',                      45.00, NULL, 1),
  ('IMG-RX-CH',  'Rayos X Tórax PA',                   'Radiografía de tórax proyección PA',                220.00, NULL, 1),
  ('IMG-US-ABD', 'Ultrasonido abdominal',              'US abdomen completo',                                450.00, NULL, 1),
  ('IMG-ECG',    'Electrocardiograma (ECG)',           '12 derivaciones',                                    160.00, NULL, 1),
  ('PROC-NEB',   'Nebulización',                       'Administración por nebulización',                     60.00, 15, 1),
  ('PROC-IM-IV', 'Aplicación de inyección IV',         'Colocación y administración intravenosa',             50.00, 10, 1),
  ('PROC-IM-IM', 'Aplicación de inyección IM',         'Administración intramuscular',                        40.00, 10, 1),
  ('PROC-CUR',   'Curación de herida',                 'Aseo, antisepsia y vendaje',                          90.00, 20, 1),
  ('PROC-SUT',   'Sutura simple',                      'Cierre de herida hasta 5 cm',                        250.00, 30, 1),
  ('PROC-SUT-R', 'Retiro de suturas',                  'Extracción y curación posterior',                     80.00, 15, 1),
  ('PROC-PAP',   'Papanicolaou',                       'Toma de citología cervical',                         200.00, NULL, 1),
  ('PROC-PLAN',  'Planificación familiar',             'Consejería y métodos',                               120.00, 30, 1),
  ('VAC-TD',     'Vacuna Td',                          'Tétanos-difteria',                                   125.00, NULL, 1),
  ('VAC-INF',    'Vacuna influenza',                   'Dosis estacional',                                   140.00, NULL, 1),
  ('VAC-HEP-B',  'Vacuna Hepatitis B (adulto)',        'Esquema adulto',                                     180.00, NULL, 1);


INSERT INTO Tarifas (id_procedimiento, precio)
SELECT c.id_procedimiento_catalogo, c.precio_base
FROM CatalogoProcedimientos c
WHERE c.codigo IN (
  'CONS-GEN','CONS-CONT','LAB-CBC','LAB-GLU','LAB-LIP','LAB-URI',
  'IMG-RX-CH','IMG-US-ABD','IMG-ECG',
  'PROC-NEB','PROC-IM-IV','PROC-IM-IM','PROC-CUR','PROC-SUT','PROC-SUT-R','PROC-PAP','PROC-PLAN',
  'VAC-TD','VAC-INF','VAC-HEP-B'
);

##PACIENTES MOCK
INSERT INTO Pacientes
  (nombres, apellidos, dpi, fecha_nacimiento, sexo, direccion, telefono, correo, estado_civil)
VALUES
  ('Juan Carlos',   'Pérez López',         '2456789012345', '1988-03-14', 'M', 'Zona 12, Ciudad de Guatemala', '55123456', 'juan.perez@example.com',       'casado'),
  ('María José',    'Gómez de León',       '2456789012346', '1992-07-22', 'F', 'Mixco, Condado Naranjo',        '44112233', 'maria.gomez@example.com',      'soltera'),
  ('Luis Alberto',  'Hernández Ramírez',   '2456789012347', '1985-11-05', 'M', NULL,                             '42123456', NULL,                            'casado'),
  ('Ana Lucía',     'Rodríguez García',    '2456789012348', '1999-01-19', 'F', 'Villa Nueva, Col. Santa Isabel', '66223344', 'ana.lucia@example.com',        'soltera'),
  ('Carlos Andrés', 'López Méndez',        '2456789012349', '1978-05-30', 'M', 'Zona 7, Colonia Quinta Samayoa', '33119988', 'carlos.lopez@example.com',     'casado'),
  ('Sofía',         'Ramírez Castillo',    '2456789012350', '2001-09-12', 'F', 'Antigua Guatemala, Sacatepéquez','77665544', 'sofia.ramirez@example.com',    'soltera'),
  ('Diego',         'Morales Estrada',     '2456789012351', '1990-02-02', 'M', 'Zona 18, Los Álamos',            '51234567', 'diego.morales@example.com',    'union libre'),
  ('Valentina',     'Hernández López',     '2456789012352', '1996-08-21', 'F', 'Amatitlán, barrio El Relleno',   '55778899', 'valentina.hdz@example.com',    'soltera'),
  ('Javier',        'Fuentes Barrios',     '2456789012353', '1983-03-03', 'M', 'Zona 1, Centro Histórico',       '34561234', 'javier.fuentes@example.com',   'divorciado'),
  ('Gabriela',      'Reyes Marroquín',     '2456789012354', '1994-06-17', 'F', 'Santa Catarina Pinula',           '40223344', 'gabriela.reyes@example.com',   'casada'),
  ('Marco',         'Chávez Morales',      '2456789012355', '1981-10-28', 'M', 'Quetzaltenango, zona 3',          '78654321', 'marco.chavez@example.com',     'casado'),
  ('Alejandra',     'Pineda López',        '2456789012356', '2000-12-09', 'F', 'Zona 16, Cayalá',                 '66443322', 'alejandra.pineda@example.com', 'soltera'),
  ('Fernando',      'García Pineda',       '2456789012357', '1975-07-07', 'M', 'Escuintla, Col. Centro',          '77889900', 'fernando.garcia@example.com',  'viudo'),
  ('Paola',         'Sicán Pérez',         '2456789012358', '1993-04-25', 'F', 'Zona 10, Oakland',                '31234567', 'paola.sican@example.com',      'casada'),
  ('Ricardo',       'Méndez Aguirre',      '2456789012359', '1987-09-18', 'M', NULL,                             '56781234', 'ricardo.mendez@example.com',   'union libre'),
  ('Daniela',       'Loarca Figueroa',     '2456789012360', '1998-02-14', 'F', 'Villa Canales, San José',         '47001234', 'daniela.loarca@example.com',   'soltera'),
  ('Pablo',         'Juárez Ortiz',        '2456789012361', '1991-11-11', 'M', 'Zona 2, Barrio Moderno',          '36549871', 'pablo.juarez@example.com',     'casado'),
  ('Mónica',        'Cano Herrera',        '2456789012362', '1989-05-05', 'F', 'Fraijanes, Col. El Cerrito',      '45997766', 'monica.cano@example.com',      'divorciada'),
  ('Hugo',          'León Ruano',          '2456789012363', '1979-01-23', 'M', 'San Miguel Petapa',               '55443322', 'hugo.leon@example.com',        'casado'),
  ('Andrea',        'Soto Alvarado',       '2456789012364', '2002-03-29', 'F', 'Zona 5, La Palmita',              '42334455', NULL,                            'soltera');

##MEDICOS MOCK
INSERT INTO Medicos
  (nombres, apellidos, numero_colegiado, especialidad, telefono, correo, horario_laboral)
VALUES
  ('Alejandro', 'Méndez Ruiz',     'COL-00123', 'Medicina Interna',        '5511-2233', 'alejandro.mendez@clinicagt.com', 'L-V 08:00-16:00; S 08:00-12:00'),
  ('Beatriz',   'López Arana',     'COL-00124', 'Pediatría',               '5511-2244', 'beatriz.lopez@clinicagt.com',   'L-V 09:00-17:00'),
  ('Carlos',    'Ramírez Soto',    'COL-00125', 'Cardiología',             '5511-2255', 'carlos.ramirez@clinicagt.com',  'L-V 08:00-14:00'),
  ('Diana',     'Castillo Robles', 'COL-00126', 'Ginecología',             '5511-2266', 'diana.castillo@clinicagt.com',  'L-V 10:00-18:00'),
  ('Eduardo',   'García Juárez',   'COL-00127', 'Ortopedia',               '5511-2277', 'eduardo.garcia@clinicagt.com',  'L-V 08:00-16:00'),
  ('Fernanda',  'Soto Barrios',    'COL-00128', 'Dermatología',            '5511-2288', 'fernanda.soto@clinicagt.com',   'L-V 09:00-15:00'),
  ('Gerardo',   'Pineda León',     'COL-00129', 'Otorrinolaringología',    '5511-2299', 'gerardo.pineda@clinicagt.com',  'L-V 08:00-16:00'),
  ('Helena',    'Morales Quiñónez','COL-00130', 'Oftalmología',            '5511-2300', 'helena.morales@clinicagt.com',  'L-V 08:00-16:00'),
  ('Iván',      'Juárez Herrera',  'COL-00131', 'Neurología',              '5511-2311', 'ivan.juarez@clinicagt.com',     'L-V 09:00-17:00'),
  ('Julia',     'Reyes Méndez',     NULL,       'Medicina General',        '5511-2322', 'julia.reyes@clinicagt.com',     'L-V 08:00-16:00');

##USUARIOS MOCK
INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('recep01', 'Recep*2025', 'recepcionista',  NULL, NULL, 0, NULL, NULL);

##USUARIOS MEDICOS MOCK
INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
SELECT
  LOWER(
    CONCAT(
      'dr.',
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LEFT(m.nombres,1),
        'Á','a'),'É','e'),'Í','i'),'Ó','o'),'Ú','u'),'Ñ','n'),
      '.',
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        LOWER(SUBSTRING_INDEX(m.apellidos,' ',1)),
        'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),'ñ','n'),
      '.',
      COALESCE(REPLACE(LOWER(m.numero_colegiado),'-',''), CONCAT('m', m.id_medico))
    )
  )                    AS nombre_usuario,
  'Medico*2025'        AS contrasena,
  'medico'             AS rol,
  m.id_medico,
  NULL                 AS id_paciente,
  0                    AS eliminado,
  NULL                 AS eliminado_en,
  NULL                 AS eliminado_por
FROM Medicos m
LEFT JOIN Usuarios u
  ON u.id_medico = m.id_medico
WHERE u.id_usuario IS NULL;

##MOCK USUARIO PACIENTE
INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('juan.perez','Paciente*2025', 'paciente', NULL, 1, 0, NULL, NULL);

INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('ana.lucia', 'Paciente*2025', 'paciente', NULL, 4, 0, NULL, NULL);

INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('gabriela.reyes', 'Paciente*2025', 'paciente', NULL, 10, 0, NULL, NULL);

INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('daniela.loarca', 'Paciente*2025', 'paciente', NULL, 16, 0, NULL, NULL);

INSERT INTO Usuarios
  (nombre_usuario, contrasena, rol, id_medico, id_paciente, eliminado, eliminado_en, eliminado_por)
VALUES
  ('andrea.soto', 'Paciente*2025', 'paciente', NULL, 20, 0, NULL, NULL);

##MOCK CITAS MEDICAS
INSERT INTO CitasMedicas (id_paciente, id_medico, fecha, estado, razon_cancelacion)
VALUES (1, 1, '2025-09-03 09:00:00', 'confirmada', NULL);

INSERT INTO CitasMedicas (id_paciente, id_medico, fecha, estado, razon_cancelacion)
VALUES (4, 2, '2025-09-03 10:30:00', 'confirmada', NULL);

INSERT INTO CitasMedicas (id_paciente, id_medico, fecha, estado, razon_cancelacion)
VALUES (10, 3, '2025-09-03 11:15:00', 'cancelada', 'Paciente no podrá asistir');

INSERT INTO CitasMedicas (id_paciente, id_medico, fecha, estado, razon_cancelacion)
VALUES (16, 4, '2025-09-04 08:45:00', 'reprogramada', 'Reprogramada por disponibilidad del médico');

INSERT INTO CitasMedicas (id_paciente, id_medico, fecha, estado, razon_cancelacion)
VALUES (20, 5, '2025-09-04 09:30:00', 'confirmada', NULL);

##CONSULTAS MEDICAS
-- Cita 1: Paciente 1 con Médico 1
INSERT INTO ConsultasMedicas
  (id_paciente, id_medico, id_cita, fecha, motivo_consulta, diagnostico, observaciones)
VALUES
  (1, 1, 1, '2025-09-03 09:00:00',
   'Cefalea y fatiga desde hace 3 días',
   'Cefalea tensional',
   'Se recomienda hidratación, descanso, higiene del sueño y analgésico PRN');

-- Cita 2: Paciente 4 con Médico 2
INSERT INTO ConsultasMedicas
  (id_paciente, id_medico, id_cita, fecha, motivo_consulta, diagnostico, observaciones)
VALUES
  (4, 2, 2, '2025-09-03 10:30:00',
   'Estornudos, congestión nasal y prurito ocular',
   'Rinitis alérgica estacional',
   'Evitar alérgenos, lavados nasales con solución salina, control de síntomas');

-- Cita 3: Paciente 10 con Médico 3
-- (La cita estaba cancelada, pero para efectos de mock generamos la consulta.)
INSERT INTO ConsultasMedicas
  (id_paciente, id_medico, id_cita, fecha, motivo_consulta, diagnostico, observaciones)
VALUES
  (10, 3, 3, '2025-09-03 11:15:00',
   'Consulta diferida por motivos personales',
   'Sin evaluación clínica completa',
   'Se brindan recomendaciones generales y se programa control si persisten síntomas');

-- Cita 4: Paciente 16 con Médico 4
INSERT INTO ConsultasMedicas
  (id_paciente, id_medico, id_cita, fecha, motivo_consulta, diagnostico, observaciones)
VALUES
  (16, 4, 4, '2025-09-04 08:45:00',
   'Dolor pélvico cíclico y dismenorrea',
   'Dismenorrea primaria',
   'Aplicar calor local, educación sobre síntomas de alarma, analgésico/antiinflamatorio');

-- Cita 5: Paciente 20 con Médico 5
INSERT INTO ConsultasMedicas
  (id_paciente, id_medico, id_cita, fecha, motivo_consulta, diagnostico, observaciones)
VALUES
  (20, 5, 5, '2025-09-04 09:30:00',
   'Dolor de rodilla derecha tras actividad física',
   'Gonalgia por sobreuso (sospecha patelofemoral)',
   'Reposo relativo, hielo post-ejercicio, ejercicios de fortalecimiento, control en 2 semanas');

##RECETAS MEDICAS
-- Receta para la consulta de la Cita 1
INSERT INTO RecetasMedicas (id_consulta, medicamento, dosis, frecuencia, duracion)
SELECT cm.id_consulta, 'Ibuprofeno 400 mg', '1 tableta', 'cada 8 horas', '5 días'
FROM ConsultasMedicas cm WHERE cm.id_cita = 1;

-- Receta para la consulta de la Cita 2
INSERT INTO RecetasMedicas (id_consulta, medicamento, dosis, frecuencia, duracion)
SELECT cm.id_consulta, 'Loratadina 10 mg', '1 tableta', 'cada 24 horas', '7 días'
FROM ConsultasMedicas cm WHERE cm.id_cita = 2;

-- Receta para la consulta de la Cita 3 (consulta diferida)
INSERT INTO RecetasMedicas (id_consulta, medicamento, dosis, frecuencia, duracion)
SELECT cm.id_consulta, 'Solución salina nasal 0.9%', '2 aplicaciones por fosa', 'cada 6 horas', '5 días'
FROM ConsultasMedicas cm WHERE cm.id_cita = 3;

-- Receta para la consulta de la Cita 4
INSERT INTO RecetasMedicas (id_consulta, medicamento, dosis, frecuencia, duracion)
SELECT cm.id_consulta, 'Naproxeno 500 mg', '1 tableta', 'cada 12 horas', '3 días'
FROM ConsultasMedicas cm WHERE cm.id_cita = 4;

-- Receta para la consulta de la Cita 5
INSERT INTO RecetasMedicas (id_consulta, medicamento, dosis, frecuencia, duracion)
SELECT cm.id_consulta, 'Paracetamol 500 mg', '1–2 tabletas', 'cada 8 horas', '5 días'
FROM ConsultasMedicas cm WHERE cm.id_cita = 5;

##MOCK PROCEDIMIENTOS MEDICOS
-- Consulta de la Cita 1: CONS-GEN
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Consulta inicial por cefalea y fatiga'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'CONS-GEN'
WHERE cm.id_cita = 1;

-- Cita 1: inyección IM
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Aplicación de analgésico IM'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'PROC-IM-IM'
WHERE cm.id_cita = 1;

-- Consulta de la Cita 2: LAB-GLU
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Solicitud de glucosa en sangre'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'LAB-GLU'
WHERE cm.id_cita = 2;

-- Cita 2: LAB-CBC (hemograma)
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Hemograma completo para descartar infección'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'LAB-CBC'
WHERE cm.id_cita = 2;

-- Consulta de la Cita 3: CONS-CONT (control)
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Consulta de control diferida'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'CONS-CONT'
WHERE cm.id_cita = 3;

-- Consulta de la Cita 4: PROC-PAP (Papanicolaou)
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Toma de citología cervical'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'PROC-PAP'
WHERE cm.id_cita = 4;

-- Cita 4: LAB-URI (EGO)
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Examen general de orina por síntomas asociados'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'LAB-URI'
WHERE cm.id_cita = 4;

-- Consulta de la Cita 5: CONS-GEN
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Evaluación por gonalgia derecha'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'CONS-GEN'
WHERE cm.id_cita = 5;

-- Cita 5: Inyección IM (analgésico)
INSERT INTO ProcedimientosMedicos (id_consulta, id_procedimiento_catalogo, procedimiento, descripcion)
SELECT cm.id_consulta, c.id_procedimiento_catalogo, c.nombre, 'Analgésico intramuscular por dolor'
FROM ConsultasMedicas cm
JOIN CatalogoProcedimientos c ON c.codigo = 'PROC-IM-IM'
WHERE cm.id_cita = 5;


