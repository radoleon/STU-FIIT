WITH selected_season AS (
	SELECT '{{season_id}}' AS season_id
),
all_players AS (
	SELECT DISTINCT 
		player1_id AS player_id, 
		game_id 
	FROM play_records
	JOIN games 
		ON games.id = play_records.game_id
	WHERE season_id = (SELECT season_id FROM selected_season)
    
	UNION

	SELECT DISTINCT 
		player2_id AS player_id, 
		game_id 
	FROM play_records
	JOIN games 
		ON games.id = play_records.game_id
	WHERE season_id = (SELECT season_id FROM selected_season)
),
stats_points AS (
	SELECT 
		player1_id AS player_id, 
		game_id,
		SUM (
			CASE 
				WHEN event_msg_type = 'FIELD_GOAL_MADE' THEN 2 
				WHEN event_msg_type = 'FREE_THROW' AND score IS NOT NULL THEN 1
				ELSE 0
			END
		) AS points
	FROM play_records
	JOIN games 
		ON games.id = play_records.game_id
	WHERE season_id = (SELECT season_id FROM selected_season)
	GROUP BY play_records.player1_id, game_id
),
stats_assists AS (
	SELECT 
		player2_id AS player_id, 
		game_id,
		SUM (
			CASE 
				WHEN event_msg_type = 'FIELD_GOAL_MADE' THEN 1 
				ELSE 0 
			END
		) AS assists
	FROM play_records
	JOIN games 
		ON games.id = play_records.game_id
	WHERE season_id = (SELECT season_id FROM selected_season)
	GROUP BY play_records.player2_id, game_id
		HAVING player2_id IS NOT NULL
),
stats_rebounds AS (
	SELECT
		player1_id AS player_id,
		game_id,
		SUM (
			CASE 
				WHEN event_msg_type = 'REBOUND' THEN 1 
				ELSE 0 
			END
		) AS rebounds
	FROM play_records
	JOIN games 
		ON games.id = play_records.game_id
	WHERE season_id = (SELECT season_id FROM selected_season)
	GROUP BY play_records.player1_id, game_id
		HAVING player1_id IS NOT NULL
),
triple_doubles AS (
	SELECT * 
	FROM (
		SELECT 
			player_id,
			game_id,
			points,
			assists,
			rebounds,
			(points >= 10 AND assists >= 10 AND rebounds >= 10) AS is_triple_double,
			ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY game_id) AS game_order
		FROM (
			SELECT
				all_players.player_id, 
				all_players.game_id, 
				COALESCE (points, 0) AS points, 
				COALESCE (assists, 0) AS assists, 
				COALESCE (rebounds, 0) AS rebounds
			FROM all_players
			LEFT JOIN stats_points
				ON stats_points.player_id = all_players.player_id
					AND stats_points.game_id = all_players.game_id
			LEFT JOIN stats_assists
				ON stats_assists.player_id = all_players.player_id
					AND stats_assists.game_id = all_players.game_id
			LEFT JOIN stats_rebounds
				ON stats_rebounds.player_id = all_players.player_id
					AND stats_rebounds.game_id = all_players.game_id
		)
	) 
	WHERE is_triple_double = TRUE
),
ranked_triple_doubles AS (
	SELECT
        player_id,
		game_id,
        game_order,
        (game_order - ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY game_order)) AS rank_order
    FROM triple_doubles
)
SELECT 
	player_id, 
	MAX(count_strike) AS max_strike
FROM (
	SELECT 
		player_id, 
		COUNT(*) AS count_strike 
	FROM ranked_triple_doubles
	GROUP BY player_id, rank_order
)
GROUP BY player_id
ORDER BY max_strike DESC, player_id ASC
