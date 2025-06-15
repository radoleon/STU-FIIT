CREATE OR REPLACE VIEW v_combat_state AS
SELECT
    c.id AS combat_id,
    c.round,
    cc.character_id,
    ch.name AS character_name,
    cc.action_points
FROM t_combats AS c
JOIN t_characters_combats AS cc 
	ON cc.combat_id = c.id
JOIN t_characters AS ch 
	ON ch.id = cc.character_id
WHERE
    cc.health > 0 AND 
	cc.surrender = false
ORDER BY combat_id;

CREATE OR REPLACE VIEW v_most_damage AS
SELECT 
	ch.id AS character_id,
	ch.name AS character_name,
	grouped.total_damage
FROM (
	SELECT
		created_character_id,
		SUM(COALESCE(damage, 0)) AS total_damage
	FROM t_combat_logs
	WHERE 
		target_character_id IS NOT NULL
	GROUP BY created_character_id
) AS grouped
JOIN t_characters AS ch
	ON ch.id = grouped.created_character_id
ORDER BY grouped.total_damage DESC;

CREATE OR REPLACE VIEW v_strongest_characters AS
SELECT
	grouped.combat_id,
	cc.character_id,
	ch.name AS character_name,
	grouped.total_damage,
	cc.health
FROM (
	SELECT
	    combat_id,
		created_character_id,
	    SUM(COALESCE(damage, 0)) AS total_damage
	FROM t_combat_logs
	WHERE
		target_character_id IS NOT NULL
	GROUP BY combat_id, created_character_id
) AS grouped
JOIN t_characters_combats AS cc
	ON grouped.created_character_id = cc.character_id AND
		grouped.combat_id = cc.combat_id
JOIN t_characters AS ch 
	ON ch.id = cc.character_id
ORDER BY (grouped.total_damage + cc.health) DESC;

CREATE OR REPLACE VIEW v_combat_damage AS
SELECT
    combat_id,
    SUM(damage) AS total_damage
FROM t_combat_logs
WHERE 
	damage IS NOT NULL AND
	target_character_id IS NOT NULL
GROUP BY combat_id
ORDER BY total_damage DESC;

CREATE OR REPLACE VIEW v_spell_statistics AS
SELECT
    s.id AS spell_id,
    s.name AS spell_name,
    COUNT(*) AS total_casts,
    COALESCE(COUNT(cl.damage), 0) AS total_hits,
    COUNT(*) - COALESCE(COUNT(cl.damage), 0) AS total_misses,
    SUM(cl.damage) AS total_damage
FROM t_combat_logs AS cl
JOIN t_spells AS s
    ON cl.spell_id = s.id
WHERE s.healing = false
GROUP BY s.id, s.name
ORDER BY total_casts DESC;
