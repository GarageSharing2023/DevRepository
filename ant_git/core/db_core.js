const mysql2 = require('mysql2');

const db_core = {

    pool: null,

    get_pool: () => {

        this.db_core.pool = 
            mysql2.createPool({
                host                : "93.93.115.118",
                user                : "autobuddy.it",
                password            : "autobuddy**@",
                database            : "garage_sharing",
                waitForConnections  : true,
                connectionLimit     : 100,
                maxIdle             : 10,
                idleTimeout         : 60000, 
                queueLimit          : 0,
                socketPath          : "/var/run/mysqld/mysqld.sock"
            });
    },

    get_connection: (success, error) => {
        
        if(!this.db_core.pool){
            this.db_core.get_pool();
        }

        this.db_core.pool.getConnection((err, connection) => {
            if(err){
                error(err);
            }else{
                if(connection){
                    success(connection, this.db_core.pool);
                }else{
                    error({message: "connection is null"});
                }
            }
        });
    }

};

exports.db_core = db_core;
