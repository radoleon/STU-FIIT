WITH selected_season AS (
	SELECT '{{season_id}}' AS season_id
),
players_changed AS (
    SELECT 
		player_id,
		COUNT(DISTINCT players_games.player_team_id) changes
    FROM (
        SELECT DISTINCT 
            player1_id AS player_id, 
            player1_team_id AS player_team_id,
            game_id
        FROM play_records
        WHERE play_records.event_msg_type IN ('FREE_THROW', 'FIELD_GOAL_MADE', 'FIELD_GOAL_MISSED', 'REBOUND')
        
        UNION
        
        SELECT DISTINCT 
            player2_id AS player_id, 
            player2_team_id AS player_team_id,
            game_id
        FROM play_records
        WHERE play_records.event_msg_type IN ('FREE_THROW', 'FIELD_GOAL_MADE', 'FIELD_GOAL_MISSED', 'REBOUND')
    ) AS players_games
    JOIN games
        ON games.id = players_games.game_id
    WHERE season_id = (SELECT season_id FROM selected_season)
    GROUP BY player_id
    HAVING COUNT(DISTINCT players_games.player_team_id) > 1
),
players_sorted AS (
	SELECT player_id
	FROM players_changed
	JOIN players
		ON players_changed.player_id = players.id
	ORDER BY 
		players_changed.changes DESC,
		players.is_active DESC,
		players.last_name ASC,
		players.first_name ASC
	LIMIT 5
),
player1_stats AS (
    SELECT
        game_id, 
        player1_id AS player_id, 
        player1_team_id AS team_id,
        SUM (
			CASE 
			WHEN play_records.event_msg_type = 'FIELD_GOAL_MADE' THEN 2 
			WHEN play_records.event_msg_type = 'FREE_THROW' AND play_records.score IS NOT NULL THEN 1
			ELSE 0
			END
        ) AS points,
        0 AS assists
    FROM play_records
    JOIN games 
		ON play_records.game_id = games.id
    WHERE season_id = (SELECT season_id FROM selected_season)
      	AND player1_id IN (SELECT player_id FROM players_sorted)
    GROUP BY game_id, player1_id, player1_team_id
),
player2_stats AS (
    SELECT 
        game_id, 
        player2_id AS player_id, 
        player2_team_id AS team_id,
        0 AS points,
        SUM (
			CASE 
			WHEN play_records.event_msg_type = 'FIELD_GOAL_MADE' THEN 1
			ELSE 0
			END
        ) AS assists
    FROM play_records
    JOIN games 
		ON play_records.game_id = games.id
    WHERE season_id = (SELECT season_id FROM selected_season)
		AND player2_id IN (SELECT player_id FROM players_sorted)
    GROUP BY game_id, player2_id, player2_team_id
),
stats AS (
    SELECT * FROM player1_stats
    UNION ALL
    SELECT * FROM player2_stats
)
SELECT
	grouped.player_id,
	players.first_name,
	players.last_name,
	grouped.team_id,
	teams.full_name,
	grouped.ppg AS "PPG",
	grouped.apg AS "APG",
	grouped.games
FROM (
	SELECT 
	    stats.player_id,
	    stats.team_id,
	    ROUND(SUM(stats.points) / COUNT(DISTINCT stats.game_id), 2) AS ppg,
	    ROUND(SUM(stats.assists) / COUNT(DISTINCT stats.game_id), 2) AS apg,
	    COUNT(DISTINCT stats.game_id) AS games
	FROM stats
	GROUP BY stats.player_id, stats.team_id
) AS grouped
JOIN players
	ON players.id = grouped.player_id
JOIN teams
	ON teams.id = grouped.team_id
ORDER BY player_id ASC, team_id ASC
