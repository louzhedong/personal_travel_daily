-- Add a FULLTEXT index for server-side marker search.
-- MySQL 8 includes the ngram parser, which gives much better matching for Chinese travel notes.
CREATE FULLTEXT INDEX `ft_visit_markers_scope_city_note`
ON `visit_markers` (`scope_name`, `city`, `note`)
WITH PARSER ngram;
