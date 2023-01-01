import Postgrator from "postgrator";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv"

dotenv.config()
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Create a client of your choice
  const client = new pg.Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  try {
    // Establish a database connection
    await client.connect();

    // Create postgrator instance
    const postgrator = new Postgrator({
      migrationPattern: __dirname + "/migrations/*",
      driver: "pg",
      database: process.env.PGDATABASE,
      schemaTable: "schemaversion",
      execQuery: (query) => client.query(query),
    });

    const result = await postgrator.migrate();
    if (result.length === 0) {
      console.log("No new migration file detected")
    } else {
      console.log('Migration succeeded!')
    }
  } catch (error) {
    // If error happened partially through migrations,
    // error object is decorated with appliedMigrations
    console.error(error); // array of migration objects
  }

  // Once done migrating, close your connection.
  await client.end();
}
main();
