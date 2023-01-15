ALTER TABLE orders
ADD COLUMN user_id integer,
ADD FOREIGN KEY (user_id) REFERENCES users (id);
