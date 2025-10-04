-- Adicionar coluna url à tabela programacoes
ALTER TABLE programacoes
ADD COLUMN IF NOT EXISTS url TEXT;

-- Atualizar registros existentes copiando o valor de url_iframe para url
UPDATE programacoes
SET url = url_iframe
WHERE url IS NULL;