WITH selected_player AS (
    SELECT players.id AS player_id
	FROM players 
	WHERE first_name = '{{first_name}}' 
		AND last_name = '{{last_name}}'
),
seasons AS (
    SELECT season_id
    FROM play_records
    JOIN games ON games.id = play_records.game_id
    WHERE 
		(play_records.player1_id = (SELECT player_id FROM selected_player)
			OR play_records.player2_id = (SELECT player_id FROM selected_player))
        AND games.season_type = 'Regular Season'
    GROUP BY season_id
    HAVING COUNT(DISTINCT game_id) >= 50
),
stats AS (
    SELECT 
        games.season_id,
        games.id AS game_id,
        SUM(CASE WHEN event_msg_type = 'FIELD_GOAL_MADE' THEN 1 ELSE 0 END) AS made,
        SUM(CASE WHEN event_msg_type = 'FIELD_GOAL_MISSED' THEN 1 ELSE 0 END) AS missed,
		COALESCE (
	        SUM(CASE WHEN event_msg_type = 'FIELD_GOAL_MADE' THEN 1 ELSE 0 END) * 100.0 / 
	        NULLIF(SUM(CASE WHEN event_msg_type IN ('FIELD_GOAL_MADE', 'FIELD_GOAL_MISSED') THEN 1 ELSE 0 END), 0), 0
		) AS success
    FROM play_records
    JOIN games ON games.id = play_records.game_id
    WHERE play_records.player1_id = (SELECT player_id FROM selected_player)
        AND games.season_id IN (SELECT season_id FROM seasons)
    GROUP BY games.season_id, games.id
),
differences AS (
    SELECT 
        season_id,
        game_id,
        success,
        COALESCE(LAG(success) OVER (PARTITION BY season_id ORDER BY game_id), success) AS prev_success
    FROM stats
)
SELECT 
	season_id,
	ROUND(AVG(ABS(success - prev_success)), 2) AS stability
FROM differences
GROUP BY season_id
ORDER BY stability, season_id
