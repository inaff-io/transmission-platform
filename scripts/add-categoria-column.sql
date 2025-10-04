-- Postgres script to ensure categoria column exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='usuarios' AND column_name='categoria'
	) THEN
		EXECUTE 'ALTER TABLE usuarios ADD COLUMN categoria text DEFAULT ''user''';
	END IF;
	EXECUTE 'UPDATE usuarios SET categoria = ''user'' WHERE categoria IS NULL';
END $$;
