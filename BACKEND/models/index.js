const pgp = require("pg-promise")();
const db = pgp("postgres://username:password@host:port/database");