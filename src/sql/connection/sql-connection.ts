import * as mysql from "mysql2/promise";
import { Sql } from "../../commons/enums/sql.type";

// create the connection to database
export async function initMysql2() {
  try {
    return await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "sql6_test",
      port: 8889,
    });
  } catch (e) {
    console.log(`error establishing mysql db connection`);
    throw e;
  }
}
export async function EXECUTE_QUERY(query: Sql<any>) {
    const connection = await initMysql2();
    const [result] = await connection.execute(query);
    return result;
}
