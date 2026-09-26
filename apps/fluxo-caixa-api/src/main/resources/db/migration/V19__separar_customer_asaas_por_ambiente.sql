ALTER TABLE assinaturas
    ADD COLUMN asaas_customer_environment VARCHAR(20) NULL
        AFTER asaas_customer_id;

UPDATE assinaturas
SET asaas_customer_environment = 'SANDBOX'
WHERE asaas_customer_id IS NOT NULL
  AND asaas_customer_environment IS NULL;
