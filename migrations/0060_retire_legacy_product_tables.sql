-- Retire the old Courts, Pool Courts, debate sourcing, sponsorship, affiliate
-- placement and clue-based Mystery Footballer schema. This release uses the
-- question-set Mystery Footballer tables and the current game-presence table.
-- The only Pool Court record was a cancelled pre-launch placeholder with no
-- participants, positions, reserves or wallet ledger entries.

DROP TABLE IF EXISTS court_replies;
DROP TABLE IF EXISTS court_reactions;
DROP TABLE IF EXISTS court_arguments;
DROP TABLE IF EXISTS court_participants;
DROP TABLE IF EXISTS court_roars;
DROP TABLE IF EXISTS court_adjudications;
DROP TABLE IF EXISTS court_editorial_reviews;
DROP TABLE IF EXISTS court_suggestion_sources;
DROP TABLE IF EXISTS settle_argument_episodes;
DROP TABLE IF EXISTS match_poll_votes;
DROP TABLE IF EXISTS match_poll_options;
DROP TABLE IF EXISTS match_polls;
DROP TABLE IF EXISTS court_suggestions;
DROP TABLE IF EXISTS courts;

DROP TABLE IF EXISTS pool_invite_acceptances;
DROP TABLE IF EXISTS pool_positions;
DROP TABLE IF EXISTS pool_invites;
DROP TABLE IF EXISTS pool_adjudications;
DROP TABLE IF EXISTS pool_courts;

DROP TABLE IF EXISTS affiliate_click_events;
DROP TABLE IF EXISTS affiliate_item_placements;
DROP TABLE IF EXISTS sponsor_events;
DROP TABLE IF EXISTS sponsor_campaign_placements;
DROP TABLE IF EXISTS sponsor_event_rate_limits;
DROP TABLE IF EXISTS affiliate_items;
DROP TABLE IF EXISTS sponsor_campaigns;
DROP TABLE IF EXISTS sponsor_placement_catalog;

DROP TABLE IF EXISTS debate_candidates;
DROP TABLE IF EXISTS debate_source_fingerprints;
DROP TABLE IF EXISTS debate_source_feeds;
DROP TABLE IF EXISTS source_pipeline_control;

DROP TABLE IF EXISTS mystery_game_guesses;
DROP TABLE IF EXISTS mystery_game_rounds;
DROP TABLE IF EXISTS mystery_player_clues;
DROP TABLE IF EXISTS mystery_players;
DROP TABLE IF EXISTS mystery_game_presence;
