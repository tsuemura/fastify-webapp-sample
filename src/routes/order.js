export default async function orderRoutes(server, options) {
  const client = await server.pg.connect();

  const order = async (fullname, tel, receiveTime, user_id) => {
    const { rows } = await client.query(
      "INSERT INTO orders (customer_name, customer_tel, customer_receive_time, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [fullname, tel, receiveTime, user_id]
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

  const getOrders = async (user_id) => {
    const { rows } = await client.query(
      `SELECT
        orders.id order_id,
        items.name name,
        items.price price,
        order_items.quantity quantity,
        orders.created_at created_at,
        orders.customer_receive_time customer_receive_time
      FROM
        orders,
        items,
        order_items
      WHERE
        orders.user_id = $1
        AND orders.id = order_items.order_id
        AND items.id = order_items.item_id
      `,
      [user_id]
    );

    /**
     * Compose object like this:
     * [
     *  {
     *    order_id: 1,
     *    created_at: '2022-01-01'
     *    customer_receive_time: '11:15'
     *    items: [
     *      {
     *        order_id: 1,
     *        name: "鶏唐揚弁当",
     *        price: 500,
     *        quantity:3
     *        created_at: '2022-01-01'
     *        customer_receive_time: '11:15'
     *      }
     *    ]
     *  }
     * ]
     */
    return rows.reduce((orders, item) => {
      const index = orders.findIndex(
        (order) => (order.order_id == item.order_id)
      );
      if (index >= 0) {
        orders[index].items.push(item);
      } else {
        orders.push({
          order_id: item.order_id,
          created_at: item.created_at,
          customer_receive_time: item.customer_receive_time,
          items: [item],
        });
      }
      return orders;
    }, []);
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
    const orderId = await order(fullname, tel, receiveTime, request?.user?.id);

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

  server.get('/order/history', async (request, reply) => {
    const { user_id } = request.query
    if (!(request.user.is_admin || user_id == request.user.id)) {
      return reply.redirect(302, '/order')
    }

    const { rows } = await client.query('SELECT id FROM users WHERE id = $1', [user_id])
    if (rows.length === 0) {
      return reply.redirect(302, '/order')
    }

    const orders = await getOrders(user_id)

    console.log(orders)
    await reply.view('src/views/orderHistory.ejs', {orders})
  })
}

