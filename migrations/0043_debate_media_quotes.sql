-- Enrich editorial debate candidates with source-owned visuals and quote attribution.
ALTER TABLE debate_candidates ADD COLUMN image_url TEXT;
ALTER TABLE debate_candidates ADD COLUMN image_caption TEXT;
ALTER TABLE debate_candidates ADD COLUMN image_credit TEXT;
ALTER TABLE debate_candidates ADD COLUMN pull_quote TEXT;
ALTER TABLE debate_candidates ADD COLUMN pull_quote_author TEXT;
ALTER TABLE debate_candidates ADD COLUMN quote_source_url TEXT;
CREATE INDEX IF NOT EXISTS idx_debate_candidates_image ON debate_candidates(status,image_url);
