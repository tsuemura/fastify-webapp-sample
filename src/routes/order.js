export default async function orderRoutes(server, options) {
  const client = await server.pg.connect();

  const order = async (fullname, tel, receiveTime) => {
    const { rows } = await client.query(
      "INSERT INTO orders (customer_name, customer_tel, customer_receive_time) VALUES ($1, $2, $3) RETURNING id",
      [fullname, tel, receiveTime]
      );
      return rows[0].id;
  };

  /**
   *
   * orderedItemsRecord is expected to be like this:
   * [
   *   {
   *     id: 42,
   *     name: 'foo',
   *     quantity: 2,
   *     price: 114514,
   *   }
   * ]
   */
  const getOrderedItems = async (orderedItems) => {
    // https://stackoverflow.com/questions/10720420/node-postgres-how-to-execute-where-col-in-dynamic-value-list-query
    const itemIds = Object.keys(orderedItems);
    const { rows } = await client.query(
      "SELECT id, name, price FROM items WHERE id = ANY($1::int[])",
      [itemIds]
    );

    // concatenate queried item and quantity
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: orderedItems[row.id],
      price: row.price,
    }));
  };

  server.get("/order", async (request, reply) => {
    const items = request.session.items;
    const orderedItems = items ? await getOrderedItems(items) : undefined

    await reply.view("/src/views/order.ejs", {
      items: orderedItems,
      user: request.user,
    });
  });

  server.post("/order", async (request, reply) => {
    const items = request.session.items;
    const { fullname, tel, receiveTime } = request.body;
    const orderId = await order(fullname, tel, receiveTime);

    const itemIds = Object.keys(items);
    const orderedItems = await getOrderedItems(itemIds);

    for (const itemId in items) {
      const quantity = Number(items[itemId]);
      await client.query(
        "INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)",
        [orderId, Number(itemId), quantity]
      );
    }

    // flush items in session
    request.session.items = {};

    const totalPrice = orderedItems.reduce(
      (total, orderedItem) => total + orderedItem.price * orderedItem.quantity,
      0
    );

    await reply.view("/src/views/orderComplete.ejs", {
      orderedItems,
      totalPrice,
    });
  });

}

