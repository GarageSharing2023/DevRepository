const db_core = require('../core/db_core');

const sedeers_routes = {

    seeding_process: (request, response) => {

        const password              = request.body.password;
        const delete_all            = request.body.delete_all;
        const entity_number_seed    = request.body.entity_number_seed;

        if(password !== "4e0e9c27-ab51-4863-bd7b-4df79da2f6b3-4e0e9c27-ab51-4863-bd7b-4df79da2f6b3-9984fd9f-94ee-4354-8dea-b11fbcbfd6d9"){
            response.json({
                success: false,
                errors: ["invalid password"]
            });
            return;
        }

        db_core.db_core.get_connection(
            async (connection, pool) => {

                if(delete_all == "1"){
                    await connection.promise().query(`DELETE FROM gs_final_user`);
                    await connection.promise().query(`DELETE FROM gs_manager`);
                    await connection.promise().query(`DELETE FROM gs_garage`);
                    await connection.promise().query(`DELETE FROM gs_parking_space`);
                    await connection.promise().query(`DELETE FROM gs_reserved_parking_space`);
                }

                let index = 0;
                this.sedeers_routes.stack_seed(index, 0, () => {

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

    run_seed: (connection, pool, count, done, stop) => {
        if(count < done){
            
            // Manager
            connection.query(
                `
                    INSERT INTO gs_manager 
                        (
                            type_subject, 
                            business_name,
                            first_name,
                            last_name,
                            vat_number,
                            fiscal_code,
                            email,
                            password,
                            stripe_private_key,
                            stripe_public_key
                        )
                    VALUES
                        (
                            ?, 
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                `,
                [
                    1,
                    `Guest ${done}`,
                    "Jon",
                    `Doe ${done}`,
                    "00000000000",
                    "00000000000000",
                    `jon_doe_${done}@guest.it`,
                    'guest',
                    null,
                    null
                ],
                (error, result, fields) => {

                    

                }
            );

        }else{
            stop();
        }
    },

    stack_seed: (connection, pool, count, done, stop) => {
        run_seed();
    }

};

exports.sedeers_routes = sedeers_routes;