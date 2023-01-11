const mysql = require('mysql');

module.exports = class DB {
    constructor (config) {
        this.config = config
    }

    connect() {
        this.pool = mysql.createPool(this.config);
    }
}

