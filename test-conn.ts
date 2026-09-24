import "dotenv/config";
import mariadb from "mariadb";

(async () => {
  try {
    const conn = await mariadb.createConnection({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      allowPublicKeyRetrieval: true,
    });
    console.log("Connected:", await conn.query("SELECT 1 AS ok"));
    await conn.end();
  } catch (e) {
    console.error("REAL ERROR:", e);
  }
})();