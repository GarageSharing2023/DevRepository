const db_core = require('../core/db_core');

const utility = {

    disable_entity: (request, response) => {

        const entity    = request.body.entity;
        const id        = request.body.id;
        const disabled  = (request.body.disabled ?? -1).toString();

        if(!entity){
            response.json({
                success: false,
                errors: ["entity cannot be null"]
            });
            return;
        }

        if(!id){
            response.json({
                success: false,
                errors: ["id cannot be null"]
            });
            return;
        }

        if(disabled !== "0" && disabled !== "1"){
            response.json({
                success: false,
                errors: ["disabled must be 0 or 1"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `UPDATE ${entity} SET disabled = ${disabled} WHERE id = ${id}`,
                    (error, result, fields) => {
                        
                        pool.releaseConnection(connection);

                        if(error){
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }

                        response.json({
                            success: true
                        });

                    }
                );

            },
            (error) => {
                response.json({
                    success: false,
                    errors: [error.message]
                });
            }
        );

    }

};

exports.utility_routes = utility;