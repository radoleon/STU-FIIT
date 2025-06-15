WITH field_stats AS ( 
    SELECT
        teams.id AS team_id,
   		team_history.city || ' ' || team_history.nickname AS team_name,
        games.id AS game_id,
        CASE
            WHEN games.home_team_id = teams.id THEN 'HOME'
            ELSE 'AWAY'
        END AS field
    FROM teams
    JOIN games
        ON games.home_team_id = teams.id OR games.away_team_id = teams.id
    JOIN team_history
        ON team_history.team_id = teams.id
        AND games.game_date >= TO_DATE(team_history.year_founded || '-07-01', 'YYYY-MM-DD')
        AND games.game_date <= 
            CASE 
                WHEN team_history.year_active_till = 2019 THEN CURRENT_DATE
                ELSE TO_DATE(team_history.year_active_till || '-06-30', 'YYYY-MM-DD')
            END
)
SELECT 
    team_id,
    team_name,
    COUNT(CASE WHEN field = 'AWAY' THEN 1 END) AS number_away_matches,
    ROUND(
		COALESCE (
	        COUNT(CASE WHEN field = 'AWAY' THEN 1 END) * 100.0 / 
	        NULLIF(COUNT(*), 0), 0
		), 2
    ) AS percentage_away_matches,
    COUNT(CASE WHEN field = 'HOME' THEN 1 END) AS number_home_matches,
    ROUND(
		COALESCE (
	        COUNT(CASE WHEN field = 'HOME' THEN 1 END) * 100.0 / 
	        NULLIF(COUNT(*), 0), 0
		), 2
    ) AS percentage_home_matches,
    COUNT(*) AS total_games
FROM field_stats
GROUP BY team_id, team_name
ORDER BY team_id ASC, team_name ASC;
