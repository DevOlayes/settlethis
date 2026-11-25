-- The old Host / Editor workflow existed only for retired Matchday polls and Courts.
-- Remove its orphaned access and audit records after retiring the associated proposal queue.
DROP TABLE IF EXISTS editorial_staff_audit;
DROP TABLE IF EXISTS editorial_staff;
