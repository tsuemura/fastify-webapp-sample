CREATE TABLE users_favorites (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id integer NOT NULL,
    item_id integer NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
)
