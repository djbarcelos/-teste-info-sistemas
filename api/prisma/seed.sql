-- Dados iniciais para desenvolvimento / Docker.
-- Idempotente: só insere placas que ainda não existem (roda a cada subida da API se RUN_DB_SEED=true).

INSERT INTO "vehicles" ("id", "placa", "chassi", "renavam", "modelo", "marca", "ano", "created_at", "updated_at")
SELECT gen_random_uuid()::text,
       v.placa,
       v.chassi,
       v.renavam,
       v.modelo,
       v.marca,
       v.ano,
       NOW(),
       NOW()
FROM (
  VALUES
    ('ABC1D23', '9BWZZZ377VT004251', '12345678901', 'HB20', 'Hyundai', 2023),
    ('XYZ9K87', '9BWZZZ377VT004252', '98765432109', 'Onix', 'Chevrolet', 2022),
    ('MNO4J56', '9BWZZZ377VT004253', '11122233344', 'Civic', 'Honda', 2021)
) AS v(placa, chassi, renavam, modelo, marca, ano)
WHERE NOT EXISTS (
  SELECT 1 FROM "vehicles" AS e WHERE e."placa" = v.placa
);
