CREATE TABLE t_classes (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    ap_modifier FLOAT NOT NULL,
    ac_modifier FLOAT NOT NULL,
    iv_modifier FLOAT NOT NULL,
	CHECK (ap_modifier >= 0 AND ac_modifier >= 0 AND iv_modifier >= 0)
);

CREATE TABLE t_characters (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    class_id INTEGER NOT NULL REFERENCES t_classes(id)
);

CREATE TABLE t_character_attributes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
	CHECK (title IN ('Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Health'))
);

CREATE TABLE t_characters_character_attributes (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL CHECK (value > 0),
    character_id INTEGER NOT NULL REFERENCES t_characters(id),
    character_attribute_id INTEGER NOT NULL REFERENCES t_character_attributes(id) ON DELETE CASCADE,
	UNIQUE (character_id, character_attribute_id)
);

CREATE INDEX idx_characters_character_attributes_character_id ON t_characters_character_attributes(character_id);

CREATE TABLE t_item_types (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
	CHECK (title IN ('Armor', 'Weapon', 'Spell Modifier', 'Medication'))
);

CREATE TABLE t_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    weight FLOAT NOT NULL,
    val_modifier FLOAT NOT NULL,
    item_type_id INTEGER NOT NULL REFERENCES t_item_types(id) ON DELETE CASCADE,
	CHECK (weight > 0 AND val_modifier >= 0),
	UNIQUE (name, weight, val_modifier)
);

CREATE TABLE t_spell_categories (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    base_cost FLOAT NOT NULL,
    base_dmg FLOAT NOT NULL,
	CHECK (base_cost > 0 AND base_dmg > 0)
);

CREATE TABLE t_spells (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    spell_category_id INTEGER NOT NULL REFERENCES t_spell_categories(id) ON DELETE CASCADE,
    healing BOOLEAN NOT NULL
);

CREATE TABLE t_spells_character_attributes (
    id SERIAL PRIMARY KEY,
    spell_id INTEGER NOT NULL REFERENCES t_spells(id) ON DELETE CASCADE,
    character_attribute_id INTEGER NOT NULL REFERENCES t_character_attributes(id) ON DELETE CASCADE,
    adjust_cost BOOLEAN NOT NULL DEFAULT(true),
    adjust_dmg BOOLEAN NOT NULL DEFAULT(true),
	CHECK (adjust_cost = true OR adjust_dmg = true),
	UNIQUE (spell_id, character_attribute_id)
);

CREATE INDEX idx_spells_character_attributes_spell_id ON t_spells_character_attributes(spell_id);

CREATE TABLE t_combats (
    id SERIAL PRIMARY KEY,
    round INTEGER NOT NULL CHECK (round >= 1)
);

CREATE TABLE t_characters_combats (
    id SERIAL PRIMARY KEY,
    combat_id INTEGER NOT NULL REFERENCES t_combats(id),
    character_id INTEGER NOT NULL REFERENCES t_characters(id),
    action_points FLOAT NOT NULL CHECK (action_points >= 0),
    health FLOAT NOT NULL,
    is_healing BOOLEAN NOT NULL DEFAULT(false),
    surrender BOOLEAN NOT NULL DEFAULT(false),
    skip_round BOOLEAN NOT NULL DEFAULT(false),
	UNIQUE (combat_id, character_id)
);

CREATE INDEX idx_characters_combats_combat_id ON t_characters_combats(combat_id);

CREATE TABLE t_characters_items (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES t_characters(id),
    item_id INTEGER NOT NULL REFERENCES t_items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN NOT NULL DEFAULT(false),
    is_used BOOLEAN
);

CREATE INDEX idx_characters_items_character_id ON t_characters_items(character_id);

CREATE TABLE t_combats_items (
    id SERIAL PRIMARY KEY,
    combat_id INTEGER NOT NULL REFERENCES t_combats(id),
    item_id INTEGER NOT NULL REFERENCES t_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_combats_items_combat_id ON t_combats_items(combat_id);

CREATE TABLE t_action_types (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
	CHECK (title IN ('Start Combat', 'Enter Combat', 'End Combat', 'Spell Attack', 'Item Attack', 'Start Healing', 'Spell Heal', 'Item Heal', 'Kill', 'Surrender', 'Loot Item'))
);

CREATE TABLE t_combat_logs (
    id SERIAL PRIMARY KEY,
    action_type_id INTEGER NOT NULL REFERENCES t_action_types(id),
    time TIMESTAMP NOT NULL DEFAULT(CURRENT_TIMESTAMP),
    combat_id INTEGER NOT NULL REFERENCES t_combats(id),
    round INTEGER NOT NULL,
    created_character_id INTEGER REFERENCES t_characters(id),
    target_character_id INTEGER REFERENCES t_characters(id),
    spell_id INTEGER REFERENCES t_spells(id) ON DELETE SET NULL,
    item_id INTEGER REFERENCES t_items(id) ON DELETE SET NULL,
    damage FLOAT,
	CHECK (round >= 1 AND (damage IS NULL OR damage > 0))
);

CREATE INDEX idx_combat_logs_combat_id ON t_combat_logs(combat_id);
CREATE INDEX idx_combat_logs_created_character_id ON t_combat_logs(created_character_id);
