ALTER TABLE items ADD COLUMN default_inventory INTEGER;
CREATE TABLE IF NOT EXISTS inventories (
    id SERIAL PRIMARY KEY NOT NULL,
    item_id INTEGER NOT NULL,
    inventory INTEGER,
    FOREIGN KEY (item_id) REFERENCES items(id)

)
