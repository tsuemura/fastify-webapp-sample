export default async function orderRoutes(server, options) {
  server.get("/order", async (request, reply) => {
    await reply.view("/src/views/order.ejs", {
      items: request.session.items,
    });
  });

  server.post("/order", async (request, reply) => {
    const items = request.session.items;
    const { fullname, tel, receiveTime } = request.body;
    const client = await server.pg.connect();

    const getOrderId = async () => {
      const { rows } = await client.query(
        "INSERT INTO orders (customer_name, customer_tel, customer_receive_time) VALUES ($1, $2, $3) RETURNING id",
        [fullname, tel, receiveTime]
      );
      return rows[0].id;
    };

    const orderId = await getOrderId();

    /**
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
    const getOrderedItems = async () => {
      const itemIds = Object.keys(items);

      // https://stackoverflow.com/questions/10720420/node-postgres-how-to-execute-where-col-in-dynamic-value-list-query
      const { rows } = await client.query(
        "SELECT id, name, price FROM items WHERE id = ANY($1::int[])",
        [itemIds]
      );

      // Set id as the key of each record
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        quantity: items[row.id],
        price: row.price,
      }));
    };

    const orderedItems = await getOrderedItems();

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

