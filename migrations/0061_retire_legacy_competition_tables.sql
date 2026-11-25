-- Retire the old competition coverage catalogue and matchday editorial
-- proposal queue. Fixtures remain because the current football quiz workflow
-- still uses them; these two tables have no current-release consumer.

DROP TABLE IF EXISTS matchday_content_proposals;
DROP TABLE IF EXISTS competition_catalogue;
