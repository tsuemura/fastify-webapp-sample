export default async function itemRoutes(server, options) {
  const { passport } = options

  server.get("/items", async (request, reply) => {
    const client = await server.pg.connect();
    const result = await client.query(
      "SELECT id, name, description, price FROM items"
    );

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
      await reply.view("/src/views/addItem.ejs");
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
      await reply.view("/src/views/addItem.ejs", { item: rows[0] });
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
        "SELECT id, name, description, price FROM items WHERE id = $1",
        [itemId]
      );
      const item = rows[0];
      await reply.view("/src/views/editItem.ejs", { item, modified: false });
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
      const { name, description, price } = request.body;
      const { rows } = await client.query(
        "UPDATE items SET name = $2, description = $3, price = $4, updated_at = CURRENT_DATE WHERE id = $1 RETURNING id, name, description, price",
        [itemId, name, description, price]
      );
      const item = rows[0];
      await reply.view("/src/views/editItem.ejs", { item, modified: true });
    }
  );
}
