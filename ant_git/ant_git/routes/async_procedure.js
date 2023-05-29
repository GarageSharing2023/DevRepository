const db_core = require('../core/db_core');

const async_procedure_routes = {

    update_scheduler_create_to_weld: (connection, pool) => {

        const actualMonth   = new Date().getMonth() + 1;
        let newMonth        = null;

        if(actualMonth == 12){
            newMonth = 1;
        }else{
            newMonth = actualMonth + 1;
        }

        connection.query(
            `UPDATE gs_scheduler SET next_at = "${newMonth.toString().padStart(2, '0')}" WHERE scheduler_enum = "create_weld"`,
            (error, result, fields) => {
                pool.releaseConnection(connection);
            }
        );

    },

    create_to_weld: () => {
        
        db_core.db_core.get_connection(
            (connection, pool) => {

                const now = (new Date().getMonth() + 1).toString().padStart(2, '0');
                connection.query(
                    `SELECT id FROM gs_scheduler WHERE scheduler_enum = "create_weld" AND next_at = "${now}"`,
                    (error, rows, fields) => {

                        if(error){
                            pool.releaseConnection(connection);
                        }else{

                            if(rows && rows.length > 0){

                                connection.query(
                                    `
                                        SELECT 
                                            id,
                                            id_gs_manager,
                                            reservation_commision,
                                            book_from,
                                            book_to
                                        FROM 
                                            gs_reserved_parking_space
                                        WHERE
                                            processed_for_commision = 0
                                    `,
                                    (error, rows, fields) => {
                
                                        if(error){
                                            pool.releaseConnection(connection);
                                            return;
                                        }
                
                                        if(rows && rows.length > 0){
                
                                            // Wrap
                                            const data = [];
                
                                            for(let row of rows){
                
                                                const index = data.findIndex(d => d.id_gs_manager == row.id_gs_manager);
                                                if(index == -1){
                                                    data.push(
                                                        {
                                                            id_gs_manager   : row.id_gs_manager,
                                                            amount          : row.reservation_commision,
                                                            details         : [row.id]
                                                        }
                                                    );
                                                }else{
                                                    data[index].amount = data[index].amount + row.reservation_commision;
                                                    data[index].details.push(row.id);
                                                }
                
                                            }
                
                                            // Generate queries
                                            const queries = [];
                                            data.forEach(d => {
                
                                                let ids = JSON.stringify(d.details);
                
                                                let insert_query = 
                                                    `
                                                        INSERT INTO gs_to_pay
                                                            (
                                                                amount, 
                                                                welded, 
                                                                ids_reserver_parking_space, 
                                                                id_gs_manager
                                                            )
                                                        VALUES 
                                                            (
                                                                ${(d.amount ?? 0.00).toFixed(2)},
                                                                0,
                                                                "${ids}",
                                                                ${d.id_gs_manager}
                                                            )
                                                    `;
                                                
                                                let update_query = 
                                                    `
                                                        UPDATE 
                                                            gs_reserved_parking_space 
                                                        SET processed_for_commision = 1 
                                                            WHERE id IN (${ids.split("[").join("").split("]").join("")})
                                                    `;
                                                
                                                queries.push(
                                                    {
                                                        insert: insert_query,
                                                        update: update_query
                                                    }
                                                );
                                            });
                
                                            connection.beginTransaction(async (error) => {
                
                                                if(error){
                                                    pool.releaseConnection(connection);
                                                    return;
                                                }
                
                                                // Stck recursion 
                                                const stack = (index, queries, exit) => {
                
                                                    let query = queries[index];
                
                                                    connection.query(
                                                        query.insert,
                                                        (error, result, fields) => {
                
                                                            if(error){
                                                                connection.rollback((error_) => {
                                                                    pool.releaseConnection(connection);
                                                                });
                                                                return;
                                                            }      
                
                                                            connection.query(
                                                                query.update,
                                                                (error, result, fields) => {
                
                                                                    if(error){
                                                                        connection.rollback((error_) => {
                                                                            pool.releaseConnection(connection);
                                                                        });
                                                                        return;
                                                                    }     
                
                                                                    index++;
                                                                    if(index == queries.length){
                                                                        connection.commit((error) => {
                                                                            if(!error){
                                                                                async_procedure_routes.update_scheduler_create_to_weld(connection, pool);
                                                                                exit();   
                                                                            }else{
                                                                                pool.releaseConnection(connection);
                                                                            }
                                                                        });
                                                                    }else{
                                                                        stack(index, queries, exit);
                                                                    }
                
                                                                }
                                                            );
                
                                                        }
                                                    );
                
                                                }
                
                                                let index = 0;
                                                stack(index, queries, () => {

                                                });
                
                                            });
                
                                            return;
                                        }
                
                                        async_procedure_routes.update_scheduler_create_to_weld(connection, pool);
                
                                    }
                                );

                            }else{
                                pool.releaseConnection(connection);
                            }
                        }

                    }
                );

            },
            (error) => {
                
            }
        );

    }

};

exports.async_procedure_routes = async_procedure_routes;