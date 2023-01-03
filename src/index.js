import fastify from "fastify";
import view from "@fastify/view"
import postgres from "@fastify/postgres"
import connectPgSimple from "connect-pg-simple"
import formbody from "@fastify/formbody"
import session from "@fastify/session"
import cookie from "@fastify/cookie"
import { Authenticator } from "@fastify/passport";
import LocalStrategy from "passport-local"


import ejs from "ejs"
import * as dotenv from "dotenv"

dotenv.config()
const server = fastify();
const pgSession = new connectPgSimple(session)

server.register(view, {
  engine: {
    ejs: ejs
  }
})

server.register(cookie)

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`

// allow insecure cookie only during development
server.register(session, {
  secret: process.env.SESSION_SECRET,
  store: new pgSession({
    conString: connectionString,
  }),
  cookie: process.env.NODE_ENV == "development" ? { secure: false } : {},
});

const passport = new Authenticator();
server.register(passport.initialize());
server.register(passport.secureSession());

passport.use('local', new LocalStrategy(
  function (username, password, done) {
    if (username == 'admin' && password == 'admin') {
      return done(null, {id: 1, username: 'admin'})
    }
    return done (null, false)
  }
))

passport.registerUserSerializer(async (user, request) => user.id)
passport.registerUserDeserializer((id, request) => ({ id: 1, username: 'admin', isAdmin: true}))

server.register(formbody)

server.register(postgres, {
  connectionString
})

server.get("/login", async (request, reply) => {
  await reply.view("/src/views/login.ejs");
});

server.post("/login",
  { preValidation: passport.authenticate('local', { successRedirect: '/items', authInfo: false } ) },
  async (request, reply) => {
    reply.redirect('/items')
  }
);

server.get("/items", async (request, reply) => {
  const client = await server.pg.connect()
  const result = await client.query(
    "SELECT id, name, description, price FROM items"
  );

  await reply.view("/src/views/items.ejs", {
    items: result.rows,
    itemsInCart: request.session.items,
    user: request.user
  })
})

server.post("/items", async (request, reply) => {
  const { itemId, quantity } = request.body

  // 1. Initialize
  request.session.items ??= {}

  // 2. Current quantity of the itemId
  request.session.items[itemId] ??= 0

  // 3. Increase the quantity
  request.session.items[itemId] += Number(quantity)

  await reply.redirect(302, '/order')
})

server.get(
  "/items/add",
  {
    preValidation: passport.authenticate("local", { authInfo: false },
      (request, reply) => {
        if (!request.user.isAdmin) {
          return reply.redirect(302, '/login')
        }
      }
    ),
  },
  async (request, reply) => {
    await reply.view('/src/views/addItem.ejs');
  }
);

server.post(
  "/items/add",
  {
    preValidation: passport.authenticate("local", { authInfo: false },
      (request, reply) => {
        if (!request.user.isAdmin) {
          return reply.redirect(302, '/login')
        }
      }
    ),
  },
  async (request, reply) => {
    const client = await server.pg.connect();
    const { name, description, price } = request.body
    const { rows } = await client.query("INSERT INTO items (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price", [name, description, price]);
    await reply.view('/src/views/addItem.ejs', { item: rows[0] })
  }
);

server.get("/items/:itemId/edit", {
  preValidation: passport.authenticate(
    "local",
    { authInfo: false },
    (request, reply) => {
      if (!request.user.isAdmin) {
        return reply.redirect(302, "/login");
      }
    }
  )},
  async (request, reply) => {
    const client = await server.pg.connect();
    const { itemId } = request.params
    const { rows } = await client.query("SELECT id, name, description, price FROM items WHERE id = $1", [itemId])
    const item = rows[0]
    await reply.view('/src/views/editItem.ejs', {item, modified: false})
  }
);

server.post("/items/:itemId/edit", {
  preValidation: passport.authenticate(
    "local",
    { authInfo: false },
    (request, reply) => {
      if (!request.user.isAdmin) {
        return reply.redirect(302, "/login");
      }
    }
  )},
  async (request, reply) => {
    const client = await server.pg.connect();
    const { itemId } = request.params
    const { name, description, price } = request.body
    const { rows } = await client.query(
      "UPDATE items SET name = $2, description = $3, price = $4, updated_at = CURRENT_DATE WHERE id = $1 RETURNING id, name, description, price",
      [itemId, name, description, price]
    );
    const item = rows[0]
    await reply.view('/src/views/editItem.ejs', {item, modified: true})
  }
);


server.get("/order", async (request, reply) => {

  await reply.view("/src/views/order.ejs", {
    items: request.session.items
  })
})

server.post("/order", async (request, reply) => {
  const items = request.session.items
  const { fullname, tel, receiveTime } = request.body
  const client = await server.pg.connect();

  const getOrderId = async () => {
    const { rows } = await client.query(
      "INSERT INTO orders (customer_name, customer_tel, customer_receive_time) VALUES ($1, $2, $3) RETURNING id",
      [fullname, tel, receiveTime]
    );
    return rows[0].id
  }

  const orderId = await getOrderId()

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
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        quantity: items[row.id],
        price: row.price,
      })
    );
  }


  const orderedItems = await getOrderedItems();

  for (const itemId in items) {
    const quantity = Number(items[itemId])
    await client.query(
      "INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)",
      [orderId, Number(itemId), quantity]
    )
  }

  // flush items in session
  request.session.items = {}

  const totalPrice = orderedItems.reduce(
    (total, orderedItem) => ( total + (orderedItem.price * orderedItem.quantity)),
    0
  );

  await reply.view('/src/views/orderComplete.ejs', { orderedItems, totalPrice })
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
