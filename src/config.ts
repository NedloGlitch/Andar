import { Users } from './entity/Users';
import { Questions } from './entity/Questions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export const sqliteConfig: SqliteConnectionOptions = {
  type: "sqlite",
  database: "database.db",
  entities: [Users, Questions],
  synchronize: true,
  logging: false
}
//export const postgresConfig = sqliteConfig
export const mysqlConfig:MysqlConnectionOptions = {
  type: "mysql",
  host: "f80b6byii2vwv8cx.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
  port: 3306,
  username: "ra89bfmdrx3hizpl",
  password: process.env.MYSQL_PASSWORD,
  database: "xhk2fnk2le3o66wm",
  synchronize: true,
  logging: false,
  entities: [Users, Questions],
  extra: {
    charset: "utf8mb4_unicode_ci"
  }
}