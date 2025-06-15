CREATE OR REPLACE FUNCTION sp_cast_spell(
	p_caster_id INTEGER,
	p_target_id INTEGER,
	p_spell_id INTEGER
) RETURNS VOID AS $$
DECLARE
	v_combat_id INTEGER;
	v_spell_cost FLOAT;
	v_spell_dmg FLOAT;
	v_caster_ap FLOAT;
	v_roll INTEGER;
	v_caster_strength INTEGER;
	v_caster_intelligence INTEGER;
	v_target_dexterity INTEGER;
	v_target_ac_modifier FLOAT;
	v_action_attack_id INTEGER;
	v_action_kill_id INTEGER;
	v_round INTEGER;
	v_target_health FLOAT;
	v_return_item INTEGER;
BEGIN
	SELECT combat_id, action_points INTO v_combat_id, v_caster_ap
	FROM t_characters_combats
	WHERE 
		character_id = p_caster_id AND 
		action_points > 0 AND 
		health > 0 AND
		is_healing = false AND
		surrender = false AND 
		skip_round = false
	LIMIT 1;

	IF v_combat_id IS NULL THEN
		RAISE EXCEPTION 'Caster cannot cast the spell or is not in a valid combat.';
	END IF;

	IF (
		SELECT COUNT(*)
		FROM t_characters_combats
		WHERE
			combat_id = v_combat_id AND
			character_id = p_target_id AND 
			health > 0 AND
			is_healing = false AND
			surrender = false
	) != 1 THEN
		RAISE EXCEPTION 'Target enemy is not active in the combat.';
	END IF;

	v_spell_cost := f_effective_spell_cost(p_spell_id, p_caster_id);
	v_spell_dmg := f_effective_spell_dmg(p_spell_id, p_caster_id);

	IF v_caster_ap - v_spell_cost < 0 THEN
		RAISE EXCEPTION 'Caster does not have enough action points.';
	END IF;

	UPDATE t_characters_combats 
	SET action_points = action_points - v_spell_cost 
	WHERE 
		character_id = p_caster_id AND
		combat_id = v_combat_id;

	v_roll := FLOOR(RANDOM() * 20 + 1)::INT;

	SELECT round INTO v_round FROM t_combats WHERE id = v_combat_id;
	
	SELECT id INTO v_action_attack_id FROM t_action_types WHERE title = 'Spell Attack';
	SELECT id INTO v_action_kill_id FROM t_action_types WHERE title = 'Kill';

	IF v_roll <= 2 THEN
		INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, target_character_id, spell_id) 
		VALUES (v_action_attack_id, v_combat_id, v_round, p_caster_id, p_target_id, p_spell_id);
		RETURN;
	ELSIF v_roll < 19 THEN
		SELECT cl.ac_modifier, cca.value INTO v_target_ac_modifier, v_target_dexterity
		FROM t_characters AS c
		JOIN t_classes AS cl ON c.class_id = cl.id
		JOIN t_characters_character_attributes AS cca ON cca.character_id = c.id
		JOIN t_character_attributes AS ca ON cca.character_attribute_id = ca.id
		WHERE 
			ca.title = 'Dexterity' AND
			c.id = p_target_id;

		v_caster_strength := f_character_attribute_value('Strength', p_caster_id);
		v_caster_intelligence := f_character_attribute_value('Intelligence', p_caster_id);

		IF ((10 + v_target_dexterity / 2 + v_target_ac_modifier) > (v_caster_strength / 2 + v_caster_intelligence * (v_roll::FLOAT / 10))) THEN
			INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, target_character_id, spell_id) 
			VALUES (v_action_attack_id, v_combat_id, v_round, p_caster_id, p_target_id, p_spell_id);
			RETURN;
		END IF;
	END IF;

	UPDATE t_characters_combats 
	SET health = health - v_spell_dmg 
	WHERE 
		character_id = p_target_id AND 
		combat_id = v_combat_id;

	INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, target_character_id, spell_id, damage) 
	VALUES (v_action_attack_id, v_combat_id, v_round, p_caster_id, p_target_id, p_spell_id, v_spell_dmg);

	SELECT health INTO v_target_health
	FROM t_characters_combats 
	WHERE 
		character_id = p_target_id AND 
		combat_id = v_combat_id;

	IF v_target_health <= 0 THEN
		INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id) 
		VALUES (v_action_kill_id, v_combat_id, v_round, p_target_id);

		FOR v_return_item IN
			SELECT item_id FROM t_characters_items
			WHERE 
				is_equipped = true AND
				character_id = p_target_id
		LOOP
			INSERT INTO t_combats_items (combat_id, item_id)
			VALUES (v_combat_id, v_return_item);
		END LOOP;

		DELETE FROM t_characters_items
		WHERE 
			is_equipped = true AND
			character_id = p_target_id;
	END IF;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION f_effective_spell_cost(
	p_spell_id INTEGER,
	p_caster_id INTEGER
) RETURNS NUMERIC AS $$
DECLARE
	v_effective_cost NUMERIC;
	v_base_cost FLOAT;
	v_attribute INTEGER;
	v_cost_attr_res FLOAT := 1;
	v_item_modifier FLOAT;
	v_intelligence INTEGER;
BEGIN
	SELECT base_cost INTO v_base_cost
	FROM t_spells AS s
	JOIN t_spell_categories AS sc
		ON s.spell_category_id = sc.id 
	WHERE s.id = p_spell_id;

	FOR v_attribute IN
		SELECT cca.value
		FROM t_spells_character_attributes AS sca
		JOIN t_characters_character_attributes AS cca
			ON cca.character_attribute_id = sca.character_attribute_id
		WHERE
			sca.spell_id = p_spell_id AND
			sca.adjust_cost = true AND
			cca.character_id = p_caster_id
	LOOP
		v_cost_attr_res := v_cost_attr_res - (v_attribute::FLOAT / 100);
	END LOOP;

	v_item_modifier := f_equipped_item_modifier('Spell Modifier', p_caster_id);
	
	IF v_item_modifier IS NOT NULL THEN
		v_cost_attr_res := v_cost_attr_res * (1 - (f_character_attribute_value('Intelligence', p_caster_id)::FLOAT / 100) * v_item_modifier);
	END IF;
	
	v_effective_cost := v_base_cost * v_cost_attr_res;
	
	RETURN v_effective_cost;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION f_effective_spell_dmg(
	p_spell_id INTEGER,
	p_caster_id INTEGER
) RETURNS NUMERIC AS $$
DECLARE
	v_effective_dmg NUMERIC;
	v_base_dmg FLOAT;
	v_attribute INTEGER;
	v_dmg_attr_res FLOAT := 1;
BEGIN
	SELECT base_dmg INTO v_base_dmg
	FROM t_spells AS s
	JOIN t_spell_categories AS sc
		ON s.spell_category_id = sc.id 
	WHERE s.id = p_spell_id;

	FOR v_attribute IN
		SELECT cca.value
		FROM t_spells_character_attributes AS sca
		JOIN t_characters_character_attributes AS cca
			ON cca.character_attribute_id = sca.character_attribute_id
		WHERE
			sca.spell_id = p_spell_id AND
			sca.adjust_dmg = true AND
			cca.character_id = p_caster_id
	LOOP
		v_dmg_attr_res := v_dmg_attr_res + (v_attribute::FLOAT / 20);
	END LOOP;
	
	v_effective_dmg := v_base_dmg * v_dmg_attr_res;
	
	RETURN v_effective_dmg;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION f_character_attribute_value(
	p_title TEXT,
	p_character_id INTEGER
) RETURNS NUMERIC AS $$
DECLARE
	v_value INTEGER;
BEGIN
	SELECT cca.value INTO v_value
		FROM t_characters_character_attributes AS cca
		JOIN t_character_attributes AS ca
			ON cca.character_attribute_id = ca.id
		WHERE 
			ca.title = p_title AND
			cca.character_id = p_character_id;
	
	RETURN v_value;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION f_equipped_item_modifier(
	p_title TEXT,
	p_character_id INTEGER
) RETURNS NUMERIC AS $$
DECLARE
	v_modifier INTEGER;
BEGIN
	SELECT i.val_modifier INTO v_modifier 
	FROM t_characters_items AS ci
	JOIN t_items AS i
		ON ci.item_id = i.id
	JOIN t_item_types AS it
		ON i.item_type_id = it.id
	WHERE
		ci.character_id = p_character_id AND
		ci.is_equipped = true AND
		it.title = p_title
	LIMIT 1;

	RETURN v_modifier;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION sp_rest_character(
	p_character_id INTEGER
) RETURNS VOID AS $$
DECLARE
	v_combat_id INTEGER;
	v_character_ap FLOAT;
	v_action_healing_id INTEGER;
	v_action_spell_heal_id INTEGER;
	v_action_item_heal_id INTEGER;
	v_round INTEGER;
	v_item_arm_modifier FLOAT;
	v_item_arm_effect FLOAT;
	v_item_med_modifier FLOAT;
	v_item_med_effect FLOAT;
	v_max_health FLOAT;
	v_current_health FLOAT;
	v_spell_id INTEGER;
	v_spell_cost FLOAT;
	v_spell_effect FLOAT;
BEGIN
	SELECT combat_id, action_points, health INTO v_combat_id, v_character_ap, v_current_health
	FROM t_characters_combats
	WHERE 
		character_id = p_character_id AND  
		health > 0 AND
		is_healing = false AND
		surrender = false AND 
		skip_round = false
	LIMIT 1;

	IF v_combat_id IS NULL THEN
		RAISE EXCEPTION 'Character cannot rest or is not in a valid combat.';
	END IF;

	SELECT id INTO v_action_healing_id FROM t_action_types WHERE title = 'Start Healing';

	IF (
		SELECT COUNT(*)
		FROM t_combat_logs
		WHERE
			action_type_id = v_action_healing_id AND
			created_character_id = p_character_id AND
			combat_id = v_combat_id
	) != 0 THEN
		RAISE EXCEPTION 'Character was already healed in this combat.';
	END IF;

	UPDATE t_characters_combats 
	SET is_healing = true
	WHERE 
		character_id = p_character_id AND 
		combat_id = v_combat_id;

	SELECT round INTO v_round FROM t_combats WHERE id = v_combat_id;

	INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id) 
	VALUES (v_action_healing_id, v_combat_id, v_round, p_character_id);

	SELECT id INTO v_action_spell_heal_id FROM t_action_types WHERE title = 'Spell Heal';
	SELECT id INTO v_action_item_heal_id FROM t_action_types WHERE title = 'Item Heal';

	v_item_arm_modifier := f_equipped_item_modifier('Armor', p_character_id);
	v_max_health := f_character_attribute_value('Health', p_character_id);

	IF v_item_arm_modifier IS NOT NULL THEN
		v_item_arm_effect := f_character_attribute_value('Constitution', p_character_id)::FLOAT / 100 * v_item_arm_modifier;
		v_max_health := v_max_health + v_item_arm_effect;
	END IF;

	v_item_med_modifier := f_equipped_item_modifier('Medication', p_character_id);

	IF v_item_med_modifier IS NOT NULL AND v_current_health < v_max_health THEN
		v_item_med_effect := f_character_attribute_value('Health', p_character_id)::FLOAT / 100 * v_item_med_modifier;

		UPDATE t_characters_combats 
		SET health = LEAST(v_max_health, v_current_health + v_item_med_effect)
		WHERE 
			character_id = p_character_id AND 
			combat_id = v_combat_id;

		INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, damage) 
		VALUES (v_action_item_heal_id, v_combat_id, v_round, p_character_id, LEAST(v_max_health, v_current_health + v_item_med_effect) - v_current_health);
		
		v_current_health := LEAST(v_max_health, v_current_health + v_item_med_effect);
	END IF;

	WHILE v_current_health < v_max_health LOOP
		SELECT s.id INTO v_spell_id
		FROM t_spells AS s
		WHERE 
			s.healing = true AND 
			f_effective_spell_cost(s.id, p_character_id) <= v_character_ap
		ORDER BY 
			f_effective_spell_cost(s.id, p_character_id) ASC,
			f_effective_spell_dmg(s.id, p_character_id) DESC
		LIMIT 1;

		IF NOT FOUND THEN
			EXIT;
		END IF;

		v_spell_cost := f_effective_spell_cost(v_spell_id, p_character_id);
		v_spell_effect := f_effective_spell_dmg(v_spell_id, p_character_id);

		UPDATE t_characters_combats
		SET 
			health = LEAST(v_max_health, v_current_health + v_spell_effect),
			action_points = action_points - v_spell_cost
		WHERE 
			character_id = p_character_id AND 
			combat_id = v_combat_id;

		INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, spell_id, damage) 
		VALUES (v_action_spell_heal_id, v_combat_id, v_round, p_character_id, v_spell_id, LEAST(v_max_health, v_current_health + v_spell_effect) - v_current_health);
		
		v_current_health := LEAST(v_max_health, v_current_health + v_spell_effect);
		v_character_ap := v_character_ap - v_spell_cost;
	END LOOP;

	UPDATE t_characters_combats
		SET 
			skip_round = true
		WHERE 
			character_id = p_character_id AND 
			combat_id = v_combat_id;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION sp_enter_combat(
	p_combat_id INTEGER,
	p_character_id INTEGER
) RETURNS VOID AS $$
DECLARE
	v_max_health FLOAT;
	v_action_points FLOAT;
	v_item_arm_modifier FLOAT;
	v_item_arm_effect FLOAT;
	v_round INTEGER;
	v_ap_modifier FLOAT;
	v_action_enter_combat_id INTEGER;
BEGIN
	IF (
		SELECT COUNT(*)
		FROM t_combats
		WHERE id = p_combat_id
	) = 0 THEN
		RAISE EXCEPTION 'Combat with this id does not exist.';
	END IF;

	SELECT round INTO v_round FROM t_combats WHERE id = p_combat_id;

	v_item_arm_modifier := f_equipped_item_modifier('Armor', p_character_id);
	v_max_health := f_character_attribute_value('Health', p_character_id);

	IF v_item_arm_modifier IS NOT NULL THEN
		v_item_arm_effect := f_character_attribute_value('Constitution', p_character_id)::FLOAT / 100 * v_item_arm_modifier;
		v_max_health := v_max_health + v_item_arm_effect;
	END IF;

	SELECT cl.ap_modifier INTO v_ap_modifier
	FROM t_characters AS c
	JOIN t_classes AS cl
		ON cl.id = c.class_id
	WHERE c.id = p_character_id;

	v_action_points := (f_character_attribute_value('Dexterity', p_character_id) + f_character_attribute_value('Intelligence', p_character_id)) * v_ap_modifier;

	INSERT INTO t_characters_combats (combat_id, character_id, action_points, health)
	VALUES (p_combat_id, p_character_id, v_action_points, v_max_health);

	SELECT id INTO v_action_enter_combat_id FROM t_action_types WHERE title = 'Enter Combat';

	INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id) 
	VALUES (v_action_enter_combat_id, p_combat_id, v_round, p_character_id);
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION sp_loot_item(
	p_combat_id INTEGER,
	p_character_id INTEGER,
	p_item_id INTEGER
) RETURNS VOID AS $$
DECLARE 
	v_item_weight FLOAT;
	v_inventory_weight FLOAT;
	v_iv_modifier FLOAT;
	v_inventory_limit FLOAT;
	v_combats_items_id INTEGER;
	v_action_loot_item_id INTEGER;
	v_round INTEGER;
BEGIN
	IF (
		SELECT COUNT(*)
		FROM t_combats_items
		WHERE
			combat_id = p_combat_id AND
			item_id = p_item_id
	) = 0 THEN
		RAISE EXCEPTION 'This item can not be loot in this combat.';
	END IF;

	SELECT i.weight, ci.id INTO v_item_weight, v_combats_items_id
	FROM t_combats_items AS ci
	JOIN t_items AS i
		ON ci.item_id = i.id
	WHERE
		combat_id = p_combat_id AND
		item_id = p_item_id
	LIMIT 1;

	SELECT SUM(i.weight) INTO v_inventory_weight
	FROM t_characters_items AS ci
	JOIN t_items AS i
		ON ci.item_id = i.id
	WHERE character_id = p_character_id;

	IF v_inventory_weight IS NULL THEN
		v_inventory_weight := 0;
	END IF;

	SELECT cl.iv_modifier INTO v_iv_modifier
	FROM t_characters AS c
	JOIN t_classes AS cl
		ON cl.id = c.class_id
	WHERE c.id = p_character_id;

	v_inventory_limit := (f_character_attribute_value('Strength', p_character_id) + f_character_attribute_value('Constitution', p_character_id)) * v_iv_modifier;

	IF v_inventory_weight + v_item_weight <= v_inventory_limit THEN
		INSERT INTO t_characters_items (character_id, item_id)
		VALUES (p_character_id, p_item_id);

		DELETE FROM t_combats_items
		WHERE id = v_combats_items_id;

		SELECT id INTO v_action_loot_item_id FROM t_action_types WHERE title = 'Loot Item';
		SELECT round INTO v_round FROM t_combats WHERE id = p_combat_id;

		INSERT INTO t_combat_logs (action_type_id, combat_id, round, created_character_id, item_id) 
		VALUES (v_action_loot_item_id, p_combat_id, v_round, p_character_id, p_item_id);
	ELSE
		RAISE EXCEPTION 'Item can not be loot due to inventory limit.';
	END IF;
END;
$$ LANGUAGE plpgsql;

---

CREATE OR REPLACE FUNCTION sp_reset_round(
	p_combat_id INTEGER
) RETURNS VOID AS $$
DECLARE
	v_characters_combats_id INTEGER;
    v_character_id INTEGER;
    v_ap_modifier FLOAT;
    v_action_points FLOAT;
    v_round INTEGER;
    v_action_start_combat_id INTEGER;
BEGIN
	FOR v_characters_combats_id, v_character_id IN
		SELECT id, character_id
		FROM t_characters_combats
		WHERE 
			combat_id = p_combat_id AND
			health > 0 AND
			surrender = false
	LOOP
		SELECT cl.ap_modifier INTO v_ap_modifier
		FROM t_characters AS c
		JOIN t_classes AS cl
			ON cl.id = c.class_id
		WHERE c.id = v_character_id;

		v_action_points := (f_character_attribute_value('Dexterity', v_character_id) + f_character_attribute_value('Intelligence', v_character_id)) * v_ap_modifier;

		UPDATE t_characters_combats
		SET
			action_points = v_action_points,
			is_healing = false,
			skip_round = false
		WHERE id = v_characters_combats_id;
	END LOOP;

	UPDATE t_combats
		SET round = round + 1
	WHERE id = p_combat_id
	RETURNING round INTO v_round;

	SELECT id INTO v_action_start_combat_id FROM t_action_types WHERE title = 'Start Combat';

	INSERT INTO t_combat_logs (action_type_id, combat_id, round) 
	VALUES (v_action_start_combat_id, p_combat_id, v_round);
END;
$$ LANGUAGE plpgsql;
