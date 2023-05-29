const db_core = require('../core/db_core');

const admin_panel_routes = {

    queries: [
        {"key": "gs_final_user", "query": "SELECT @FIELDS@ FROM gs_final_user @WHERE@"}
    ],

    oneapi: (request, response) => {

        const entity    = request.body.entity;
        const where     = request.body.where;
        const skip      = request.body.skip;
        const take      = request.body.take;

        let where_query = ``;
        if(where && where.length > 0){
            for(let w of where){
                const field     = w.field;
                const operator  = w.operator;
                const value     = w.value;
                const skip      = w.skip;
                where_query    += field + " " + operator + " " + value + " " + skip + " ";
            }
        }
        if(where_query){
            where_query = ` WHERE ${where_query} `;
        }

        const index = admin_panel_routes.queries.findIndex(q => q.key == entity);
        if(index > -1){
            
            const query = admin_panel_routes.queries[index].query.split("@WHERE@").join(where_query ?? "");
            const query_with_limit = `${query} LIMIT ${skip}, ${take}`;
            db_core.db_core.get_connection(
                (connection, pool) => {
                    
                    connection.query(
                        query.replace("@FIELDS@", "COUNT(*) AS number_of_records"),
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

                                const number_of_records = rows[0].number_of_records;
                                if(number_of_records > 0){

                                    connection.query(
                                        query_with_limit.replace("@FIELDS@", "*"),
                                        (error, rows, fields) => {

                                            pool.releaseConnection(connection);
                                            if(error){
                                                response.json({
                                                    success: false,
                                                    errors: [error.message]
                                                });
                                                return;
                                            }

                                            if(rows && rows.length > 0){
                                                const number_of_pages = (parseInt(number_of_records / take) + (number_of_records % take == 0 ? 0 : 1)) ?? 1;
                                                response.json({
                                                    success: true,
                                                    data: {
                                                        number_of_records: number_of_records,
                                                        number_of_pages: number_of_pages,
                                                        frames: [...rows]
                                                    }
                                                });
                                            }else{
                                                response.json({
                                                    success: true,
                                                    data: {
                                                        number_of_records: 0,
                                                        number_of_pages: 0,
                                                        frames: []
                                                    }
                                                });  
                                            }

                                        }
                                    );

                                }else{
                                    pool.releaseConnection(connection);
                                    response.json({
                                        success: true,
                                        data: {
                                            number_of_records: 0,
                                            number_of_pages: 0,
                                            frames: []
                                        }
                                    });                                    
                                }

                            }else{
                                pool.releaseConnection(connection);
                                response.json({
                                    success: false,
                                    errors: ["no data"]
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
            )

            return;
        }

        response.json({
            success: false,
            errors: ["entity not found"]
        });
    }

};

exports.admin_panel_routes = admin_panel_routes;