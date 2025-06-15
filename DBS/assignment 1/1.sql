WITH plays_rebound AS (
	SELECT player1_id, event_number, game_id
	FROM play_records
	WHERE event_msg_type = 'REBOUND'
)
SELECT 
	players.id AS player_id, 
	players.first_name, 
	players.last_name,
	play_records.period,
	play_records.pctimestring AS period_time
FROM play_records
JOIN plays_rebound 
	ON plays_rebound.player1_id = play_records.player1_id 
		AND plays_rebound.game_id = play_records.game_id
		AND plays_rebound.event_number + 1 = play_records.event_number
JOIN players
	ON play_records.player1_id = players.id
WHERE play_records.event_msg_type = 'FIELD_GOAL_MADE'
	AND play_records.game_id = {{game_id}}
ORDER BY
	play_records.period ASC,
	period_time DESC,
	player_id ASC
