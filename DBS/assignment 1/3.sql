WITH selected_game AS (
	SELECT {{game_id}} AS game_id
),
play_margins AS (
    SELECT 
        play_records.id,
        CASE
            WHEN score_margin = 'TIE' THEN 0
            ELSE CAST(score_margin AS INT)
        END AS current_margin,
        COALESCE ( 
			LAG (CASE WHEN score_margin = 'TIE' THEN 0 ELSE CAST(score_margin AS INT) END) 
			OVER (PARTITION BY game_id ORDER BY event_number), 0
		) AS prev_margin
    FROM 
        play_records
    WHERE event_msg_type IN ('FIELD_GOAL_MADE', 'FREE_THROW') 
		AND score IS NOT NULL
		AND game_id = (SELECT game_id FROM selected_game)
),
player_stats AS (
	SELECT
		player_id,
		SUM(points) AS points,
	    COUNT(CASE WHEN shot_type = '2P' THEN 1 END) AS "2PM",
	    COUNT(CASE WHEN shot_type = '3P' THEN 1 END) AS "3PM",
	    COUNT(CASE WHEN event_msg_type = 'FIELD_GOAL_MISSED' THEN 1 END) AS missed_shots,
	    ROUND (
			COALESCE (
				(COUNT(CASE WHEN event_msg_type = 'FIELD_GOAL_MADE' THEN 1 END) * 100.0)
				/ NULLIF(COUNT(CASE WHEN event_msg_type IN ('FIELD_GOAL_MADE', 'FIELD_GOAL_MISSED') THEN 1 END), 0), 0
			), 2
	    ) AS shooting_percentage,
		COUNT(CASE WHEN shot_type = 'FT' THEN 1 END) AS "FTM",
	    COUNT(CASE WHEN event_msg_type = 'FREE_THROW' AND shot_type IS NULL THEN 1 END) AS missed_free_throws,
	    ROUND (
			COALESCE (
				(COUNT(CASE WHEN shot_type = 'FT' THEN 1 END) * 100.0) 
	   			/ NULLIF(COUNT(CASE WHEN event_msg_type = 'FREE_THROW' THEN 1 END), 0), 0
			), 2
	    ) AS "FT_percentage"
	FROM ( 
		SELECT 
		    play_records.id,
			event_msg_type,
			player1_id AS player_id,
		    CASE 
		        WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 2 THEN '2P'
		        WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 3 THEN '3P'
		        WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 1 THEN 'FT'
				ELSE NULL
		    END AS shot_type,
			CASE
	            WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 2 THEN 2
	            WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 3 THEN 3
	            WHEN ABS(play_margins.current_margin - play_margins.prev_margin) = 1 THEN 1
	            ELSE 0
	        END AS points
		FROM play_records
		LEFT JOIN play_margins
		    ON play_records.id = play_margins.id
		WHERE game_id = (SELECT game_id FROM selected_game)
	)
	GROUP BY player_id
)
SELECT
	player_id,
	first_name,
	last_name,
	points,
	"2PM",
	"3PM",
	missed_shots,
	shooting_percentage,
	"FTM",
	missed_free_throws,
	"FT_percentage"
FROM player_stats
JOIN players
	ON players.id = player_id
ORDER BY 
	points DESC,
	shooting_percentage DESC,
	"FT_percentage" DESC,
	player_id ASC
