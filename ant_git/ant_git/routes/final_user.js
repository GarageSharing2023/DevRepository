const db_core = require('../core/db_core');
const crypto  = require('crypto');
const fs      = require('fs');
const keys    = require('../core/project_keys');
const uuid    = require('uuid');
const utility = require('../core/utility_funcs_core');

const final_user_routes = {

    login: (request, response) => {

        const email     = request.body.email;
        let password    = request.body.password;

        if(email && password){

            password = crypto.createHmac("sha256", keys.keys.secret_key).update(password).digest("hex");

            db_core.db_core.get_connection(
                (connection, pool) => {

                    connection.query(
                        `SELECT id, email_check FROM gs_final_user WHERE email = ? AND password = ? AND disabled = 0`, [email, password], (err, rows, fields) => {
                            pool.releaseConnection(connection);
                            if(err){
                                response.json({
                                    success: false,
                                    errors: [err.message]
                                });
                            }else{
                                if(rows && rows.length > 0){
                                    response.json({
                                        success: true,
                                        data: {
                                            id: rows[0]['id'],
                                            account_verified: rows[0].email_check
                                        }
                                    });
                                }else{
                                    response.json({
                                        success: false,
                                        errors: ["user not found"]
                                    });
                                }
                            }
                        }
                    );

                },
                (err) => {
                    response.json({
                        success: false,
                        errors: [err.message]
                    });
                }
            )

        }else{
            response.json({
                success: false,
                errors: ["fill email and password"]
            });
        }

    },

    create: (request, response) => {

        const type_subject          = request.body.type_subject; // 1 = private, 2 = business
        const email                 = request.body.email;
        let password                = request.body.password;
        const business_name         = request.body.business_name;
        const first_name            = request.body.first_name;
        const last_name             = request.body.last_name;
        const vat_number            = request.body.vat_number;
        const fiscal_code           = request.body.fiscal_code;
        
        // Check errors
        const errors = [];

        if(!email){
            errors.push("fill email");
        }

        if(!password){
            errors.push("fill password");
        }

        if(type_subject != 1 && type_subject != 2){
            errors.push("type_subject must be 1, 2");
        }

        if(errors.length > 0){
            response.json({
                success: false,
                errors: errors
            });
        }else{
            
            password = crypto.createHmac("sha256", keys.keys.secret_key).update(password).digest("hex");

            db_core.db_core.get_connection(
                (connection, pool) => {

                    connection.query(
                        `
                            INSERT INTO gs_final_user 
                                (
                                    type_subject, 
                                    business_name,
                                    first_name,
                                    last_name,
                                    vat_number,
                                    fiscal_code,
                                    email,
                                    password
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
                                    ?
                                )
                        `,
                        [
                            type_subject,
                            business_name,
                            first_name,
                            last_name,
                            vat_number,
                            fiscal_code,
                            email,
                            password
                        ],
                        (error, result, fields) => {

                            pool.releaseConnection(connection);
                            if(error){
                                response.json({
                                    success: false,
                                    errors: [error.message]
                                });
                            }else{
                                if(result && result.insertId){
                                    response.json({
                                        success: true,
                                        data: {
                                            id: result.insertId
                                        }
                                    });
                                }else{
                                    response.json({
                                        success: false,
                                        errors: ["insert id not found"]
                                    });
                                }
                            }

                        }
                    );

                },
                (error) => {
                    response.json({
                        success: false,
                        errors: [error]
                    });
                }
            )

        }

    },

    get_final_user_data: (request, response) => {

        const final_user_id = request.body.final_user_id;

        if(!final_user_id){
            response.json({
                success: false,
                errors: ["final_user_id is mandatory field"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT
                            type_subject, 
                            business_name,
                            first_name,
                            last_name,
                            vat_number,
                            fiscal_code,
                            email
                        FROM gs_final_user
                            WHERE 
                                id = ${final_user_id}
                            AND
                                disabled = 0
                    `,
                    (error, rows, fields) => {

                        pool.releaseConnection(connection);

                        if(error){
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                        }else{

                            if(rows && rows.length > 0){

                                // Immagine
                                const path      = `./storage/gs_final_user/final_user_${final_user_id}/profile_image.png`;
                                const exists    = fs.existsSync(path);
                                let path_image  = null;

                                if(exists){
                                    path_image = path.split("./storage/").join("");
                                }

                                response.json({
                                    success: true,
                                    data: {
                                        type_subject    : rows[0].type_subject,
                                        business_name   : rows[0].business_name,
                                        first_name      : rows[0].first_name,
                                        last_name       : rows[0].last_name,
                                        vat_number      : rows[0].vat_number,
                                        fiscal_code     : rows[0].fiscal_code,
                                        email           : rows[0].email,
                                        profile_image   : path_image
                                    }
                                });

                            }else{
                                response.json({
                                    success: false,
                                    errors: ["not found"]
                                });
                            }

                        }

                    }
                );

            },
            (err) => {
                response.json({
                    success: false,
                    errors: [err.message]
                });
            }
        )

    },

    set_profile_image: (request, response) => {

        const final_user_id     = request.body.final_user_id;
        const base64            = request.body.base64;

        if(!final_user_id || !base64){
            response.json({
                success: false,
                errors: ["base64 and final_user_id are mandatory fields"]
            });
            return;
        }

        try{

            const path = `./storage/gs_final_user/final_user_${final_user_id}`;
            fs.mkdirSync(path, {recursive: true});
            
            const buffer = Buffer.from(base64, 'base64');
            fs.writeFileSync(`${path}/profile_image.png`, buffer);

            response.json({
                success: true,
                data: {
                    image_path: `gs_final_user/final_user_${final_user_id}/profile_image.png`
                }
            });

        }catch(e){
            response.json({
                success: false,
                errors: [e.message]
            });
        }

    },    

    book_parking: (request, response) => {

        // status = booked_up, finished_parking, in_dispute, accounted, payment_error

        const id_garage         = request.body.id_garage;
        const id_parking_space  = request.body.id_parking_space;
        const id_manager        = request.body.id_manager;
        const id_final_user     = request.body.id_final_user;
        const book_from         = request.body.book_from;
        const book_to           = request.body.book_to;
        const amount            = request.body.amount;

        if(!id_garage || !id_parking_space || !id_manager || !id_final_user || !book_from || !book_to || !amount){
            response.json({
                success: false,
                errors: ["id_garage, id_parking_space, id_manager, id_final_user, book_from, book_to, amount are mandatory_fields"]
            });
            return;
        }

        try{
            
            if(utility.utility_funcs_core.are_equals_date(book_from, book_to) || utility.utility_funcs_core.is_bigger_date(book_from, book_to)){
                response.json({
                    success: false,
                    errors: ["book_from must cannot be greater than book_to"]
                });
                return;
            }

            let elapsed_minutes = 0;
            if((elapsed_minutes = utility.utility_funcs_core.elapsed_minutes_between_dates(book_to, book_from)) < keys.keys.elapsed_minutes_parking){
                response.json({
                    success: false,
                    data: {
                        elapsed_minutes: elapsed_minutes
                    },
                    errors: [`book_from - book_to must be >= ${keys.keys.elapsed_minutes_parking}`]
                });
                return;
            }

        }catch(e){
            response.json({
                success: false,
                errors: [e.message]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `SELECT closed, opened_from, opened_to FROM gs_garage WHERE id = ${id_garage}`,
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

                            const closed = rows[0].closed;

                            if(closed == 1){
                                pool.releaseConnection(connection);    
                                response.json({
                                    success: false,
                                    errors: ["garage closed"]
                                });
                                return;
                            }

                            try{
                                
                                const garage_opened_from = book_from.split(" ")[0].trim()   + " " + rows[0].opened_from;
                                const garage_opened_to   = book_to.split(" ")[0].trim()     + " " + rows[0].opened_to;

                                let errors_dates = [];

                                if(utility.utility_funcs_core.is_smaller_date(book_from, garage_opened_from)){
                                    errors_dates.push("book_from must be >= opened_from");
                                }

                                if(utility.utility_funcs_core.is_bigger_date(book_from, garage_opened_to)){
                                    errors_dates.push("book_from must be < opened_to");
                                }

                                if(utility.utility_funcs_core.is_bigger_date(book_to, garage_opened_to)){
                                    errors_dates.push("book_to must be <= garage_opened_to");
                                }

                                if(utility.utility_funcs_core.is_smaller_date(book_to, garage_opened_from)){
                                    errors_dates.push("book_to must be > garage_opened_from");
                                }

                                if(errors_dates.length > 0){
                                    pool.releaseConnection(connection);
                                    response.json({
                                        success: false,
                                        errors: errors_dates
                                    });
                                    return;
                                }

                                const commision = (amount * keys.keys.commision) / 100;

                                connection.query(
                                    `LOCK TABLES gs_reserved_parking_space WRITE, gs_reserved_parking_space AS g READ`,
                                    (error, result, fields) => {

                                        if(error){
                                            pool.releaseConnection(connection);
                                            response.json({
                                                success: false,
                                                errors: [error.message]
                                            });
                                            return;
                                        }

                                        connection.query(
                                            `SELECT id FROM gs_reserved_parking_space WHERE status_parking = "booked_up" AND id_gs_parking_space = ${id_parking_space}`,
                                            (error, rows, fields) => {

                                                if(error){
                                                    connection.query(
                                                        "UNLOCK TABLES",
                                                        (error_, result, fields) => {
                                                            pool.releaseConnection(connection);
                                                            response.json({
                                                                success: false,
                                                                errors: [error.message]
                                                            });
                                                        }
                                                    );
                                                    return;
                                                }

                                                if(rows && rows.length == 0){

                                                    const query = 
                                                        `
                                                            INSERT INTO gs_reserved_parking_space
                                                                (
                                                                    book_from,
                                                                    book_to,
                                                                    reservation_amount,
                                                                    reservation_commision,
                                                                    status_parking,
                                                                    processed_for_commision,
                                                                    in_dispute,
                                                                    final_user_justification,
                                                                    manager_justification,
                                                                    id_gs_manager,
                                                                    id_gs_garage,
                                                                    id_gs_parking_space,
                                                                    id_gs_final_user
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
                                                                    ?,
                                                                    ?,
                                                                    ?,
                                                                    ?
                                                                )
                                                        `;
                                                    
                                                    const array_values = [
                                                        book_from,
                                                        book_to,
                                                        amount,
                                                        commision,
                                                        "booked_up",
                                                        0,
                                                        0,
                                                        null,
                                                        null,
                                                        id_manager,
                                                        id_garage,
                                                        id_parking_space,
                                                        id_final_user
                                                    ];

                                                    connection.query(
                                                        query,
                                                        array_values,
                                                        (error, result, fields) => {

                                                            connection.query(
                                                                "UNLOCK TABLES",
                                                                (error_, result_, fields) => {
                                                                    pool.releaseConnection(connection);
                                                                    if(error){
                                                                        response.json({
                                                                            success: false,
                                                                            errors: [error.message]
                                                                        });
                                                                    }else{

                                                                        const id = result.insertId;
                                                                        response.json({
                                                                            success: true,
                                                                            data: {
                                                                                id: id
                                                                            }
                                                                        });

                                                                    }
                                                                }
                                                            );

                                                        }
                                                    );

                                                }else{
                                                    connection.query(
                                                        "UNLOCK TABLES",
                                                        (error_, result, fields) => {
                                                            pool.releaseConnection(connection);
                                                            response.json({
                                                                success: false,
                                                                data: {
                                                                    occupied: true
                                                                },
                                                                errors: ["place occupied"]
                                                            });
                                                        }
                                                    );
                                                }

                                            }
                                        );

                                    }
                                );

                            }catch(e){

                                pool.releaseConnection(connection);
                                response.json({
                                    success: false,
                                    errors: [e.message]
                                });
                                return;

                            }

                        }else{
                            pool.releaseConnection(connection);
                            response.json({
                                success: false,
                                errors: ["garage not found"]
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

    },

    region_points_garages: (request, response) => {

        const region                = request.body.region;
        const province              = request.body.province;
        const postal_code           = request.body.postal_code;
        const address               = request.body.address;
        const city                  = request.body.city;
        const title                 = request.body.title;
        const opened_from           = request.body.opened_from;
        const opened_to             = request.body.opened_to;

        if(!region || !province){
            response.json({
                success: false,
                errors: ["region, province are mandatory fields"]
            });
            return;
        }

        const postal_code_query = postal_code   ? ` AND cap LIKE "%${postal_code}%"         ` : ``;
        const address_query     = address       ? ` AND address LIKE "%${address}%"         ` : ``;
        const city_query        = city          ? ` AND city LIKE "%${city}%"               ` : ``;
        const title_query       = title         ? ` AND title LIKE "%${title}%"             ` : ``;

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT
                            id,
                            title,
                            latitude, 
                            longitude,
                            closed,
                            opened_from,
                            opened_to,
                            IFNULL(hours_intervals, '[]') intervals
                        FROM
                            gs_garage
                                WHERE 
                                    disabled = 0
                                        AND
                                    region = "${region}"
                                        AND
                                    province = "${province}"
                                        ${postal_code_query}
                                        ${address_query}
                                        ${city_query}
                                        ${title_query}
                    `,
                    async (error, rows, fields) => {

                        pool.releaseConnection(connection);

                        if(error){
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }

                        let points = [];
                        if(rows && rows.length > 0){
                            rows.forEach(
                                point => {
                                    points.push(
                                        {
                                            id              : point.id,
                                            title           : point.title,
                                            latitude        : point.latitude,
                                            longitude       : point.longitude,
                                            closed          : point.closed,
                                            opened_from     : point.opened_from,
                                            opened_to       : point.opened_to,
                                            intervals       : point.intervals
                                        }
                                    );
                                }
                            );
                        }

                        if(opened_from && opened_to){

                            try{

                                let d1_ = `0001-01-01 ${opened_from}`;
                                let d2_ = `0001-01-01 ${opened_to}`;

                                if(utility.utility_funcs_core.is_smaller_date(d2_, d1_)){
                                    d2_ = `0001-01-02 ${opened_to}`;
                                }

                                const external_intervals = utility.utility_funcs_core.get_valid_intervals_between_two_dates(d1_, d2_);

                                const new_points = [];
                                for (let point of points){

                                    if(point.opened_from == "00:00" && point.opened_to == "23:59"){ //  Full
                                        new_points.push(point);
                                    }else{

                                        let intervals = JSON.parse(point.intervals ?? "[]");
                                        if(intervals.length == 0){
        
                                            let d1 = `0001-01-01 ${point.opened_from}`;
                                            let d2 = `0001-01-01 ${point.opened_to}`;

                                            if(utility.utility_funcs_core.is_smaller_date(d2, d1)){
                                                d2 = `0001-01-02 ${point.opened_to}`;
                                            }

                                            intervals = utility.utility_funcs_core.get_valid_intervals_between_two_dates(d1, d2);

                                        }
                                        
                                        let is_valid = true;
                                        if(external_intervals.length > intervals.length){
                                            is_valid = false;
                                        }
                                        if(is_valid){
                                            for(let e = 0; e < external_intervals.length; e++){
                                                if(!intervals.includes(external_intervals[e])){
                                                    is_valid = false; break;
                                                }
                                            }
                                            if(is_valid){
                                                new_points.push(point);
                                            }
                                        }
                                    }

                                }

                                points = [...new_points];

                            }catch(error){
                                response.json({
                                    success: false,
                                    errors: [error.message]
                                });
                                return;
                            }

                        }

                        points.forEach(p => delete p.intervals);

                        response.json({
                            success: true,
                            data: {
                                points: points
                            }
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

    get_garage_details: (request, response) => {

        const id_garage = request.body.id_garage;
        if(!id_garage){
            response.json({
                success: false,
                errors: ["id_garage is mandatory field"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT
                            id,
                            title,
                            subtitle,
                            info_point,
                            region,
                            province,
                            city,
                            cap, 
                            address,
                            latitude,
                            longitude,
                            closed,
                            opened_from,
                            opened_to,
                            id_gs_manager
                        FROM    
                            gs_garage
                        WHERE
                            id = ${id_garage}
                                AND
                            disabled = 0
                    `,
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

                            const garage    = rows[0];
                            let images      = [];
                            const path      = `./storage/gs_manager/manager_${garage.id_gs_manager}/garage_images/garage_${garage.id}`

                            if(fs.existsSync(path)){
                                const dirs = fs.readdirSync(path);
                                dirs.forEach(dir => {
                                    images.push(path.split("./storage/").join("") + '/' + dir);
                                });
                            }

                            response.json({
                                success: true,
                                data: {
                                    id              : garage.id,
                                    title           : garage.title,
                                    subtitle        : garage.subtitle,
                                    info_point      : garage.info_point,
                                    region          : garage.region,
                                    province        : garage.province,
                                    city            : garage.city,
                                    cap             : garage.cap,
                                    address         : garage.address,
                                    latitude        : garage.latitude,
                                    longitude       : garage.longitude,
                                    closed          : garage.closed,
                                    opened_from     : garage.opened_from,
                                    opened_to       : garage.opened_to,
                                    images          : images
                                }
                            });

                            return;
                        }

                        response.json({
                            success: false,
                            errors: ["garage not found"]
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

    get_availables_parking_spaces: (request, response) => {

        const id_garage = request.body.id_garage;

        if(!id_garage){
            response.json({
                success: false,
                errors: ["id_garage is mandatory fields"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT
                            id,
                            type_space,
                            hourly_cost,
                            additional_info
                        FROM
                            gs_parking_space
                                WHERE
                                    id_gs_garage = ${id_garage}
                                AND
                                    disabled = 0
                    `,
                    (error, rows, fields) => {

                        pool.releaseConnection(connection);
                        if(error){
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }
                        
                        const parking_spaces = [];
                        if(rows && rows.length > 0){
                            rows.forEach(row => {
                                parking_spaces.push(
                                    {
                                        id              : row.id,
                                        type_space      : row.type_space,
                                        hourly_cost     : row.hourly_cost,
                                        additional_info : row.additional_info
                                    }
                                );
                            });
                        }
                        response.json({
                            success: true,
                            data: {
                                parking_spaces: parking_spaces
                            }
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

    is_available_parking_space: (request, response) => {

        const id_parking_space = request.body.id_parking_space;
        if(!id_parking_space){
            response.json({
                success: false,
                errors: ["id_parking_space is mandatory field"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT  
                            id
                        FROM
                            gs_reserved_parking_space
                                WHERE
                                    id_gs_parking_space = ${id_parking_space}
                                AND
                                    status_parking = "booked_up"
                    `,
                    (error, rows, fields) => {

                        pool.releaseConnection(connection);
                        if(error){
                            response.json({
                                success: false,
                                errors: [error.message]
                            });
                            return;
                        }

                        let is_available = true;
                        if(rows && rows.length > 0){
                            is_available = false;
                        }
                        response.json({
                            success: true,
                            data: {
                                is_available: is_available
                            }
                        });

                    }
                )

            },
            (error) => {
                response.json({
                    success: false,
                    errors: [error.message]
                });
            }
        )

    }

};

exports.final_user_routes = final_user_routes;