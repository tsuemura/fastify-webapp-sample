CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY NOT NULL,
    customer_name TEXT NOT NULL,
    customer_tel TEXT NOT NULL,
    customer_receive_time TEXT NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    deleted_at DATE
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY NOT NULL,
    order_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    deleted_at DATE,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
