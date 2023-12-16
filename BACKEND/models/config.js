const pgp = require("pg-promise")();

const data = {
  host: "postgres",
  port: 5432,
  database: "love_agents",
  user: "postgres",
  password: "1234",
};

module.exports = pgp(data);
