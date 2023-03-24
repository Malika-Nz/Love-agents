const db = require('./config.js');

class Archive {
    static async getAll() {
        return db.any('SELECT * FROM archive');
    }

    static async getOne(id) {
        return db.oneOrNone('SELECT * FROM archive WHERE id = $1', id);
    }

    static async create(data) {
        const { id, reason } = data;

        return db.one(
            'INSERT INTO archive (id, reason) VALUES ($1, $2) RETURNING *',
            [id, reason]
        );
    }

    static async delete(id) {
        return db.none('DELETE FROM archive WHERE id = $1', id);
    }
}

module.exports = Archive;