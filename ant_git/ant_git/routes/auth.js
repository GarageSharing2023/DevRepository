const db        = require('../core/db_core');
const jwt_core  = require('../core/jwt_core');

const auth_routes = {

    // Stacco del bearer token
    get_token: (request, response) => {

        const client_id = request.body.client_id ?? "";
        const client_secret = request.body.client_secret ?? "";

        db.db_core.get_connection(
            (connection, pool) => {

                connection.query(`SELECT id FROM gs_users WHERE client_id = ? AND client_secret = ?`, [client_id, client_secret], (error, rows, fields) => {
                    
                    pool.releaseConnection(connection);
                    if(error){
                        response.json({
                            success: false,
                            errors: [error.message]
                        });
                    }else{
                        if(rows && rows.length > 0){
                            const bearer = jwt_core.jwt_core.encrypt();
                            response.json({
                                success: true,
                                data: {
                                    bearer: bearer,
                                    expires_in: "1d"
                                }
                            });
                        }else{
                            response.json({
                                success: false,
                                errors: ["user not found"]
                            });
                        }
                    }

                });

            },
            (error) => {
                response.json({
                    success: false,
                    errors: [error.message]
                });
            }
        );

        
    },

    check_token: (request, response, with_response = true, success = null, error = null) => {

        const bearer = request.body.bearer ?? "";
        jwt_core.jwt_core.validate(
            bearer,
            () => {
                if(with_response){
                    response.json({
                        success: true
                    });
                }else{
                    success();
                }
            },
            () => {
                if(with_response){
                    response.json({
                        success: false,
                        errors: ["not valid token"]
                    });
                }else{
                    error();
                }
            }
        );

    },

    refresh_token: (request, response) => {
      
        const bearer = request.body.bearer ?? "";
        jwt_core.jwt_core.validate(
            bearer,
            () => {
                const new_bearer = jwt_core.jwt_core.encrypt();
                response.json({
                    success: true, 
                    data: {
                        bearer: new_bearer,
                        expires_in: "1d"
                    }
                });
            },
            () => {
                response.json({
                    success: false,
                    errors: ["not valid token"]
                });
            }
        );

    }

};

exports.auth_routes = auth_routes;