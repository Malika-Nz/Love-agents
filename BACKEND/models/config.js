const pgp = require('pg-promise')();

const data = {
    host: 'localhost',
    port: 5432,
    database: 'love_agents',
    user: 'root',
    password: 'root'
};

module.exports = pgp(data);