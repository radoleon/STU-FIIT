TRUNCATE
    t_combat_logs,
    t_combats_items,
    t_characters_items,
    t_characters_combats,
    t_spells_character_attributes,
    t_spells,
    t_spell_categories,
    t_items,
    t_item_types,
    t_characters_character_attributes,
    t_character_attributes,
    t_characters,
    t_classes,
    t_action_types,
    t_combats
RESTART IDENTITY CASCADE;

INSERT INTO t_classes (name, ap_modifier, ac_modifier, iv_modifier) 
VALUES 
	('Warrior', 1.0, 2.0, 1.25), 
	('Mage', 1.5, 1.0, 1.1);

INSERT INTO t_character_attributes (title) 
VALUES ('Strength'), ('Dexterity'), ('Constitution'), ('Intelligence'), ('Health');

INSERT INTO t_characters (name, class_id) 
VALUES
	('Grom', 1),
	('Elira', 2),
	('Thorin', 1),
	('Lyra', 2);

INSERT INTO t_characters_character_attributes (character_id, character_attribute_id, value)
SELECT 
	1, 
	id,
    CASE title 
		WHEN 'Strength' THEN 12
	    WHEN 'Dexterity' THEN 10
	   	WHEN 'Constitution' THEN 10
	   	WHEN 'Intelligence' THEN 6
	   	WHEN 'Health' THEN 100 
   	END
FROM t_character_attributes;

INSERT INTO t_characters_character_attributes (character_id, character_attribute_id, value)
SELECT 
	2, 
	id,
    CASE title
		WHEN 'Strength' THEN 6
	   	WHEN 'Dexterity' THEN 12
		WHEN 'Constitution' THEN 8
	   	WHEN 'Intelligence' THEN 14
	   	WHEN 'Health' THEN 80 
   END
FROM t_character_attributes;

INSERT INTO t_characters_character_attributes (character_id, character_attribute_id, value)
SELECT 
	3, 
	id,
    CASE title
		WHEN 'Strength' THEN 14
	   	WHEN 'Dexterity' THEN 8
	   	WHEN 'Constitution' THEN 12
	   	WHEN 'Intelligence' THEN 5
	   	WHEN 'Health' THEN 120
   	END
FROM t_character_attributes;

INSERT INTO t_characters_character_attributes (character_id, character_attribute_id, value)
SELECT 
	4, 
	id,
    CASE title 
		WHEN 'Strength' THEN 5
	   	WHEN 'Dexterity' THEN 11
	   	WHEN 'Constitution' THEN 9
	   	WHEN 'Intelligence' THEN 13
	   	WHEN 'Health' THEN 75 
   	END
FROM t_character_attributes;

INSERT INTO t_item_types (title) 
VALUES ('Armor'), ('Weapon'), ('Spell Modifier'), ('Medication');

INSERT INTO t_items (name, weight, val_modifier, item_type_id) 
VALUES
	('Steel Armor', 10, 50, 1),
	('Battle Axe', 8, 7.5, 2),
	('Magic Wand', 2, 2.5, 3),
	('Healing Herb', 1, 0.5, 4);

INSERT INTO t_characters_items (character_id, item_id, is_equipped) 
VALUES
	(1, 1, true),
	(1, 2, true),
	(2, 3, true),
	(4, 3, true);

INSERT INTO t_spell_categories (title, base_cost, base_dmg)
VALUES
	('Fireball', 7, 20),
	('Heal Light', 3, 15),
	('Elemental', 6, 12);

INSERT INTO t_spells (name, spell_category_id, healing) 
VALUES
	('Fire Bomb', 1, false),
	('Minor Heal', 2, true),
	('Ice Lance', 3, false),
	('Lightning Strike', 1, false),
	('Rejuvenation', 1, true);
	

INSERT INTO t_spells_character_attributes (spell_id, character_attribute_id, adjust_cost, adjust_dmg)
SELECT 
	1, 
	id, 
	true, 
	true 
FROM t_character_attributes 
WHERE title = 'Intelligence' OR title = 'Strength';

INSERT INTO t_spells_character_attributes (spell_id, character_attribute_id, adjust_cost, adjust_dmg)
SELECT 
	2, 
	id, 
	false, 
	true 
FROM t_character_attributes
WHERE title = 'Constitution';

INSERT INTO t_spells_character_attributes (spell_id, character_attribute_id, adjust_cost, adjust_dmg)
SELECT 
	3, 
	id, 
	true, 
	true 
FROM t_character_attributes
WHERE title = 'Intellience' OR title = 'Dexterity';

INSERT INTO t_spells_character_attributes (spell_id, character_attribute_id, adjust_cost, adjust_dmg)
SELECT 
	4, 
	id, 
	true, 
	false 
FROM t_character_attributes
WHERE title = 'Constitution' OR title = 'Dexterity';

INSERT INTO t_spells_character_attributes (spell_id, character_attribute_id, adjust_cost, adjust_dmg)
SELECT 
	5, 
	id, 
	true, 
	true 
FROM t_character_attributes
WHERE title = 'Strength';

INSERT INTO t_action_types (title) 
VALUES ('Start Combat'), ('Enter Combat'), ('Spell Attack'), ('Spell Heal'), ('Kill'), ('Surrender'), ('Loot Item'), ('Start Healing');

INSERT INTO t_combats (round) 
VALUES (1), (1);
