export default async function orderRoutes(server, options) {

  const order = async (client, fullname, tel, receiveTime, user_id) => {
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
  const getOrderedItems = async (client, orderedItems) => {
    // https://stackoverflow.com/questions/10720420/node-postgres-how-to-execute-where-col-in-dynamic-value-list-query
    const itemIds = Object.keys(orderedItems);
    const { rows } = await client.query(
      "SELECT id, name, price, default_inventory FROM items WHERE id = ANY($1::int[])",
      [itemIds]
    );

    // concatenate queried item and quantity
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: orderedItems[row.id],
      price: row.price,
      default_inventory: row.default_inventory
    }));
  };

  const getOrdersByUserId = async (user_id) => {
    const client = await server.pg.connect();

    const { rows } = await client.query(
      `SELECT
        orders.id order_id,
        items.name name,
        items.price price,
        order_items.quantity quantity,
        orders.created_at created_at,
        orders.customer_receive_time customer_receive_time,
        orders.done
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
          done: item.done,
          items: [item],
        });
      }
      return orders;
    }, []);
  };

  const getOrders = async () => {
    const client = await server.pg.connect();
    const { rows } = await client.query(
      `SELECT
        orders.id order_id,
        items.name name,
        items.price price,
        order_items.quantity quantity,
        orders.created_at created_at,
        orders.customer_receive_time customer_receive_time,
        orders.customer_name,
        orders.customer_tel,
        orders.customer_receive_time,
        orders.done
      FROM
        orders,
        items,
        order_items
      WHERE
        orders.id = order_items.order_id
        AND items.id = order_items.item_id
      `
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
          customer_name: item.customer_name,
          customer_tel: item.customer_tel,
          created_at: item.created_at,
          customer_receive_time: item.customer_receive_time,
          done: item.done,
          items: [item],
        });
      }
      return orders;
    }, []);
  };

  const recieveOrder = async (orderId) => {
    const client = await server.pg.connect();
    await client.query("UPDATE orders SET done=true WHERE id= $1", [orderId])
    client.release();
  }

  const validate = (params, targets) => {
    return targets.reduce((carry, target) => {
      if (!params[target]) carry.push(target)
      return carry
    }, [])
  }

  server.get("/order", async (request, reply) => {
    const items = request.session.items;
    const client = await server.pg.connect()
    const orderedItems = items ? await getOrderedItems(client, items) : undefined
    client.release()

    await reply.view("/src/views/order.ejs", {
      items: orderedItems,
      user: request.user,
      query: request.query,
    });
  });


  server.post("/order", async (request, reply) => {
    const items = request.session.items;
    const { fullname, tel, receiveTime, orderDate } = request.body;

    const validationTarget = [
      'fullname',
      'tel',
      'receiveTime',
      'orderDate',
    ]

    const missing = validate(request.body, validationTarget)

    if (missing.length !== 0) {
      return await reply.redirect(302, `order?missing=${missing}&fullname=${fullname}&tel=${tel}&receiveTime=${receiveTime}&orderDate=${orderDate}`)
    }

    const client = await server.pg.connect();

    // begin transaction
    await client.query('BEGIN');
    await client.query('LOCK TABLE orders, inventories')

    const orderId = await order(client, fullname, tel, receiveTime, request?.user?.id);
    const orderedItems = await getOrderedItems(client, items);

    for (const itemId in items) {
      const quantity = Number(items[itemId]);

      const item = orderedItems.find(i => i.id == itemId)


      // Create new order
      await client.query(
        "INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)",
        [orderId, Number(itemId), quantity]
      );

      // Check the default inventory of the item
      // If the default inventory is null then it can be ordered anyways
      if (item.default_inventory === null) {
        continue;
      }

      // Only when no inventory item in the inventories table it creates a record. Otherwise, it update the inventory
      let { rows } = await client.query(
        "INSERT INTO inventories (item_id, inventory, order_date) VALUES ($1, $2, $3) ON CONFLICT (item_id, order_date) DO UPDATE SET inventory = inventories.inventory - $4 RETURNING inventories.inventory", [Number(itemId), Number(item.default_inventory) - quantity, orderDate, quantity]
      )

      // If the updated inventory is less than 0, store can't sell it. Rollback
      const inventory = rows[0].inventory

      if (inventory < 0) {
        await client.query('ROLLBACK')
        const items = await client.query(
          "SELECT name FROM items WHERE id = $1",
          [Number(itemId)]
        );
        const itemName = items.rows[0].name
        return await reply.send(`商品 ${itemName} の在庫が足りませんでした`)
      }

    }
    await client.query('COMMIT')

    client.release()

    // flush items in session
    request.session.items = {};

    const totalPrice = orderedItems.reduce(
      (total, orderedItem) => total + orderedItem.price * orderedItem.quantity,
      0
    );

    await reply.view("/src/views/orderComplete.ejs", {
      orderId,
      orderedItems,
      totalPrice,
      user: request.user,
    });
  });

  server.get('/order/history', async (request, reply) => {
    const client = await server.pg.connect();
    const { user_id } = request.query

    // if user id is not matched with the current user and the user is not admin, it will redirect to the order
    if (user_id != request.user.id && !request.user.isAdmin) {
      return reply.redirect(302, '/order')
    }

    const { rows } = await client.query('SELECT id FROM users WHERE id = $1', [user_id])
    if (rows.length === 0) {
      return reply.redirect(302, '/order')
    }
    client.release()

    const orders = await getOrdersByUserId(user_id)

    await reply.view("src/views/orderHistory.ejs", {
      orders,
      user: request.user,
    });
  })

  server.get('/order/manage', async (request, reply) => {
    // if user_id is not specified and the current user is an admin, it will show all histories
    if (!request.user.isAdmin) {
      return reply.redirect(302, '/order')
    }
    const orders = await getOrders();
    return reply.view("src/views/orderManage.ejs", {
      orders,
      user: request.user,
    });
  })

  server.post('/order/:order_id/receive', async(request, reply) => {
    const { order_id } = request.params
    if (!request.user.isAdmin) {
      return reply.redirect(302, '/order')
    }

    await recieveOrder(order_id);

    return reply.redirect("/order/manage")
  })

  server.post("/order/delete-item", (request, reply) => {
    const { item_id } = request.body
    if (item_id) {
      delete request.session.items[item_id]
    }
    return reply.redirect(302, "/order")
  })

  server.post("/order/update-item", (request, reply) => {
    const { item_id, quantity } = request.body
    if (item_id) {
      request.session.items[item_id] = quantity
    }
    return reply.redirect(302, "/order")
  })
}

