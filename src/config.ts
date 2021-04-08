import { Users } from './entity/Users';
import { Questions } from './entity/Questions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export const sqliteConfig: SqliteConnectionOptions = {
  type: "sqlite",
  database: "database.db",
  entities: [Users, Questions],
  synchronize: true,
  logging: false
}
//export const postgresConfig = sqliteConfig
export const postgresConfig: PostgresConnectionOptions = {
  type: "postgres",
    /*host: "ec2-54-155-226-153.eu-west-1.compute.amazonaws.com",
    port: 5432,
    username: "ugljkacrcymoqn",
    password: process.env.POSTGRES_PASSWORD,
    database: "d2cpa1v5m6ul8d",*/
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Users, Questions],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
}