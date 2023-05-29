const db_core = require('../core/db_core');
const keys = require('../core/project_keys');

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

    },

    get_regions: (request, response) => {
        response.json(keys.keys.regions);
    },

    get_provinces: (request, response) => {
        const provinces = [];
        keys.keys.provinces.forEach(item => {
            provinces.push({
                key     : item.sigla,
                region  : item.regione.toLocaleUpperCase()
            });
        });
        response.json(provinces);
    },

    generate_email_checker: (request, response) => {

        const entity_type   = request.body.entity_type;
        const entity_id     = request.body.entity_id;
        
        if(!entity_type || !entity_id){
            response.json({
                success: false,
                errors: ["entity_type and entity_id are mandatory fields"]
            });
            return;
        }

        if(entity_type !== "gs_final_user" && entity_type !== "gs_manager"){
            response.json({
                success: false,
                errors: ["entity_type must be gs_final_user or gs_manager"]
            });
            return;
        }

        // Random code
        let random = "";
        for(let i = 0; i < 5; i++){
            const n = Math.floor(Math.random() * 9);
            random += n;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `SELECT id FROM gs_check_email WHERE entity_type = "${entity_type}" AND id_entity = ${entity_id}`,
                    (error, rows, fields) => {

                        if(error){
                            pool.releaseConnection(connection);
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }

                        let query = `INSERT INTO gs_check_email (random_code, entity_type, id_entity) VALUES ("${random}", "${entity_type}", ${entity_id})`; 
                        if(rows && rows.length > 0){
                            query = `UPDATE gs_check_email SET random_code = "${random}" WHERE id = ${rows[0]['id']}`;
                        }

                        connection.query(
                            query,
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
                                    success: true,
                                    data: {
                                        random_code: random
                                    }
                                });

                            }
                        );

                    }
                );

            },
            (error) => {
                response.json({
                    success: false,
                    errors: [error.message]
                });
            }
        )

    },

    check_random_code: (request, response) => {

        const random_code   = request.body.random_code;
        const entity_id     = request.body.entity_id;
        const entity_type   = request.body.entity_type;

        if(!random_code || !entity_id || !entity_type){
            response.json({
                success: false,
                errors: ["random_code, entity_id and entity_type are mandatory fields"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `SELECT id FROM gs_check_email WHERE random_code = "${random_code}" AND entity_type = "${entity_type}" AND id_entity = ${entity_id}`,
                    (error, rows, fields) => {

                        if(error){
                            pool.releaseConnection(connection);
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }

                        if(rows && rows.length > 0){

                            connection.query(
                                `UPDATE ${entity_type} SET email_check = 1 WHERE id = ${entity_id}`,
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

                        }else{
                            pool.releaseConnection(connection);
                            response.json({
                                success: false,
                                errors: ["not found"]
                            });
                        }

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