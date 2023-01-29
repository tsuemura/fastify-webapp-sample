ALTER TABLE inventories ADD CONSTRAINT uc_item_id_order_date UNIQUE (item_id, order_date);
