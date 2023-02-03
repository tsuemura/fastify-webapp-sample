export default async function itemRoutes(server, options) {
  const { passport } = options

  server.get("/items", async (request, reply) => {
    const client = await server.pg.connect();
    let result
    if (request.user) {
      result = await client.query(
        `SELECT
          items.id,
          items.name,
          items.description,
          items.price,
          uf.id as favorite,
          CASE
            WHEN inventories.inventory IS NULL AND items.default_inventory IS NULL THEN null
            WHEN inventories.inventory IS NULL AND items.default_inventory IS NOT NULL THEN items.default_inventory
            WHEN inventories.inventory IS NOT NULL THEN inventories.inventory
          END as inventory
        FROM
          items
          LEFT JOIN ( SELECT * FROM users_favorites WHERE user_id = $1 ) uf ON uf.item_id = items.id
          LEFT JOIN inventories ON inventories.item_id = items.id`,

        [request.user.id]
      );
    } else {
      result = await client.query(
        `SELECT
          items.id,
          items.name,
          items.description,
          items.price,
          CASE
            WHEN inventories.inventory IS NULL AND items.default_inventory IS NULL THEN null
            WHEN inventories.inventory IS NULL AND items.default_inventory IS NOT NULL THEN items.default_inventory
            WHEN inventories.inventory IS NOT NULL THEN inventories.inventory
          END as inventory
        FROM
          items
          LEFT JOIN inventories ON inventories.item_id = items.id
        `
      );
    }

    client.release()
    await reply.view("/src/views/items.ejs", {
      items: result.rows,
      itemsInCart: request.session?.items,
      user: request.user,
    });
  });

  server.post("/items", async (request, reply) => {
    const { itemId, quantity } = request.body;

    // 1. Initialize
    request.session.items ??= {};

    // 2. Current quantity of the itemId
    request.session.items[itemId] ??= 0;

    // 3. Increase the quantity
    request.session.items[itemId] += Number(quantity);

    await reply.redirect(302, "/order");
  });

  server.get(
    "/items/add",
    {
      preValidation: passport.authenticate(
        "local",
        { authInfo: false },
        (request, reply) => {
          if (!request.user.isAdmin) {
            return reply.redirect(302, "/login");
          }
        }
      ),
    },
    async (request, reply) => {
      await reply.view("/src/views/addItem.ejs", {
        user: request.user,
      });
    }
  );

  server.post(
    "/items/add",
    {
      preValidation: passport.authenticate(
        "local",
        { authInfo: false },
        (request, reply) => {
          if (!request.user.isAdmin) {
            return reply.redirect(302, "/login");
          }
        }
      ),
    },
    async (request, reply) => {
      const client = await server.pg.connect();
      const { name, description, price } = request.body;
      const { rows } = await client.query(
        "INSERT INTO items (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price",
        [name, description, price]
      );
      client.release()
      await reply.view("/src/views/addItem.ejs", {
        item: rows[0],
        user: request.user,
      });
    }
  );

  server.get(
    "/items/:itemId/edit",
    {
      preValidation: passport.authenticate(
        "local",
        { authInfo: false },
        (request, reply) => {
          if (!request.user.isAdmin) {
            return reply.redirect(302, "/login");
          }
        }
      ),
    },
    async (request, reply) => {
      const client = await server.pg.connect();
      const { itemId } = request.params;
      const { rows } = await client.query(
        "SELECT items.id, items.name, items.description, items.price, items.default_inventory, inventories.inventory FROM items LEFT JOIN inventories ON items.id = inventories.item_id AND inventories.order_date = CURRENT_DATE WHERE items.id = $1",
        [itemId]
      );
      const item = rows[0];
      client.release()
      await reply.view("/src/views/editItem.ejs", {
        item,
        modified: false,
        user: request.user,
      });
    }
  );

  server.post(
    "/items/:itemId/edit",
    {
      preValidation: passport.authenticate(
        "local",
        { authInfo: false },
        (request, reply) => {
          if (!request.user.isAdmin) {
            return reply.redirect(302, "/login");
          }
        }
      ),
    },
    async (request, reply) => {
      const client = await server.pg.connect();
      const { itemId } = request.params;
      const { name, description, price, default_inventory, inventory } = request.body;
      const item = (await client.query(
        "UPDATE items SET name = $2, description = $3, price = $4, default_inventory = $5, updated_at = CURRENT_DATE WHERE id = $1 RETURNING id, name, description, price, default_inventory",
        [itemId, name, description, price, default_inventory]
      )).rows[0]

      if (inventory) {
        item.inventory = (await client.query(
          `INSERT INTO inventories (item_id, inventory, order_date) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT(item_id, order_date) DO UPDATE SET inventory = $2 RETURNING inventory`,
          [itemId, inventory]
        )).rows[0].inventory
      }

      client.release()
      await reply.view("/src/views/editItem.ejs", {
        item,
        modified: true,
        user: request.user,
      });
    }
  );

  server.get(
    "/items/:itemId/favorite",
    async (request, reply) => {
      if (!request.user) {
        await reply.redirect(302, '/items')
      }
      const client = await server.pg.connect();
      const { itemId } = request.params;
      try {
        await client.query(
          "INSERT INTO users_favorites (user_id, item_id) VALUES ($1, $2)",
          [request.user.id, itemId]
        )
      } catch {}
      client.release()
      await reply.redirect(302, "/items");
    }
  );

  server.get(
    "/items/:itemId/unfavorite",
    async (request, reply) => {
      if (!request.user) {
        await reply.redirect(302, '/items')
      }
      const client = await server.pg.connect();
      const { itemId } = request.params;
      try {
        const { rows } = await client.query(
          "DELETE FROM users_favorites WHERE user_id = $1 and item_id = $2",
          [request.user.id, itemId]
        )
      } catch {}
      client.release()
      await reply.redirect(302, "/items");
    }
  );
}
