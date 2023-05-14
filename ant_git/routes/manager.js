const db_core = require('../core/db_core');
const crypto  = require('crypto');
const fs      = require('fs');
const uuid    = require('uuid');

const manager_routes = {

    login: (request, response) => {

        const email     = request.body.email;
        let password    = request.body.password;

        if(email && password){

            password = crypto.createHmac("sha256", "917d8e42-f8ce-41a6-9f39-8d30ef1f6d2d").update(password).digest("hex");

            db_core.db_core.get_connection(
                (connection, pool) => {

                    connection.query(
                        `SELECT id FROM gs_manager WHERE email = ? AND password = ? AND disabled = 0`, [email, password], (err, rows, fields) => {
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
                                            id: rows[0]['id']
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
        const stripe_private_key    = request.body.stripe_private_key;
        const stripe_public_key     = request.body.stripe_public_key;
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

        // private
        if(type_subject == 1){
            if(!first_name){
                errors.push("fill first_name if you are private");
            }
            if(!last_name){
                errors.push("fill last_name if you are private");
            }
            if(!fiscal_code){
                errors.push("fill fiscale_code if you are private");
            }
        }

        // business
        if(type_subject == 2){
            if(!business_name){
                errors.push("fill business_name if you are business");
            }
            if(!vat_number){
                errors.push("fill vat_number if you are business");
            }
        }

        if(errors.length > 0){
            response.json({
                success: false,
                errors: errors
            });
        }else{
            
            password = crypto.createHmac("sha256", "917d8e42-f8ce-41a6-9f39-8d30ef1f6d2d").update(password).digest("hex");

            db_core.db_core.get_connection(
                (connection, pool) => {

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

    get_manager_data: (request, response) => {

        const manager_id = request.body.manager_id;

        if(!manager_id){
            response.json({
                success: false,
                errors: ["manager_id is mandatory field"]
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
                        FROM gs_manager
                            WHERE 
                                id = ${manager_id}
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
                                const path      = `./storage/gs_manager/manager_${manager_id}/profile_image.png`;
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

        const manager_id    = request.body.manager_id;
        const base64        = request.body.base64;

        if(!manager_id || !base64){
            response.json({
                success: false,
                errors: ["base64 and manager_id are mandatory fields"]
            });
            return;
        }

        try{

            const path = `./storage/gs_manager/manager_${manager_id}`;
            fs.mkdirSync(path, {recursive: true});
            
            const buffer = Buffer.from(base64, 'base64');
            fs.writeFileSync(`${path}/profile_image.png`, buffer);

            response.json({
                success: true,
                data: {
                    image_path: `gs_manager/manager_${manager_id}/profile_image.png`
                }
            });

        }catch(e){
            response.json({
                success: false,
                errors: [e.message]
            });
        }

    },

    upload_garage_images: (request, response) => {

        const garage_id     = request.body.garage_id;
        const manager_id    = request.body.manager_id;
        const base64_array  = request.body.base64_array;
        const mode          = request.body.mode;

        if(!garage_id || !manager_id || base64_array.length == 0 || !mode){
            response.json({
                success: false,
                errors: ["garage id, manager_id are mandatory fields"]
            });
            return;
        }

        if(mode != "async" && mode != "sync"){
            response.json({
                success: false,
                errors: ["mode must be async or sync"]
            });
            return;
        }

        const path = `./storage/gs_manager/manager_${manager_id}/garage_images/garage_${garage_id}`;
        fs.mkdirSync(path, {recursive: true});

        let created_images = [];
        for(let image of base64_array){
            
            const image_data = 'garage_image_' + uuid.v4() + '.png';
            const buffer     = Buffer.from(image, 'base64');
            
            // Scrivi immagine..
            if(mode == "async"){
                fs.writeFile(path + '/' + image_data, buffer);
            }else{
                fs.writeFileSync(path + '/' + image_data, buffer);
            }

            created_images.push(path.split("./storage/").join("") + '/' + image_data);

        }

        response.json({
            success: true,
            data: {
                images: created_images
            }
        });

    },

    create_garage: (request, response) => {

        const id            = request.body.id;
        const title         = request.body.title;
        const subtitle      = request.body.subtitle;
        const info_point    = request.body.info_point;
        const region        = request.body.region;
        const province      = request.body.province;
        const city          = request.body.city;
        const cap           = request.body.cap;
        const address       = request.body.address;
        const latitude      = request.body.latitude;
        const longitude     = request.body.longitude;
        const manager_id    = request.body.manager_id;

        if(!title || !region || !province || !city || !cap || !address || !manager_id){
            response.json({
                success: false,
                errors: ["title, region, province, city, cap, address, manager_id are mandatory fields"]
            });
            return;
        }

        const array_values = [title, subtitle, info_point, region, province, city, cap, address, latitude, longitude, manager_id];

        let query = 
            `
                INSERT INTO gs_garage
                    (
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
                        id_gs_manager
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
                        ? 
                    )
            `;
        
        if(id){
            array_values.push(id);
            query = 
                `
                    UPDATE gs_garage SET 
                        title           = ?, 
                        subtitle        = ?, 
                        info_point      = ?, 
                        region          = ?, 
                        province        = ?, 
                        city            = ?,
                        cap             = ?,
                        address         = ?,
                        latitude        = ?,
                        longitude       = ?,
                        id_gs_manager   = ?
                    WHERE
                        id = ?
                `;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    query, 
                    array_values, 
                    (err, result, fields) => {

                        pool.releaseConnection(connection);

                        if(err){
                            response.json({
                                success: false,
                                errors: [err.message]
                            });
                        }else{

                            const inserted_id = id ? id : result.insertId;
                            if(!inserted_id){
                                response.json({
                                    success: false,
                                    errors: ["inserted_id is null"]
                                });
                            }else{

                                if(!id){ // Cartella per accogliere immagini garage
                                    fs.mkdirSync(`./storage/gs_manager/manager_${manager_id}/garage_images`, {recursive: true});
                                }

                                response.json({
                                    success: true,
                                    data: {
                                        id: inserted_id
                                    }
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
        );

    },

    get_manager_garages: (request, response) => {

        const manager_id = request.body.manager_id;

        if(!manager_id){
            response.json({
                success: false,
                errors: ["manager_id cannot be null"]
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
                            longitude 
                        FROM 
                            gs_garage 
                                WHERE id_gs_manager = ${manager_id}
                            AND
                                disabled = 0
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

                        const garages = [];
                        for (let row of rows){
                            
                            const path   = `./storage/gs_manager/manager_${manager_id}/garage_images/garage_${row['id']}`;
                            let images   = [];
                            if(fs.existsSync(path)){
                                images = fs.readdirSync(path);
                            }
                            
                            garages.push({
                                id          : row['id'],
                                title       : row['title'],
                                subtitle    : row['subtitle'],
                                info_point  : row['info_point'],
                                region      : row['region'],
                                province    : row['province'],
                                city        : row['city'],
                                cap         : row['cap'],
                                address     : row['address'],
                                latitude    : row['latitude'],
                                longitude   : row['longitude'],
                                images      : images ?? []
                            });

                        }

                        response.json({
                            success: true,
                            data: {
                                garages: garages
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

    upload_documents: (request, response) => {

        const manager_id        = request.body.manager_id;
        const identity_card     = request.body.identity_card;
        const drivers_license   = request.body.drivers_license;
        const tax_id            = request.body.tax_id;

        if(!manager_id){
            response.json({
                success: false, 
                errors: ["manager_id cannot be null"]
            });
            return;
        }

        const documents = [];

        const path = `./storage/gs_manager/manager_${manager_id}/documents`;
        if(!fs.existsSync(path)){
            fs.mkdirSync(path, {recursive: true});
        }

        if(identity_card){
            const buffer = Buffer.from(identity_card, 'base64');
            fs.writeFileSync(path + '/identity_card.png', buffer);
            documents.push(path.split("./storage/").join("") + '/identity_card.png');
        }

        if(drivers_license){
            const buffer = Buffer.from(drivers_license, 'base64');
            fs.writeFileSync(path + '/drivers_license.png', buffer);
            documents.push(path.split("./storage/").join("") + '/drivers_license.png');
        }

        if(tax_id){
            const buffer = Buffer.from(tax_id, 'base64');
            fs.writeFileSync(path + '/tax_id.png', buffer);
            documents.push(path.split("./storage/").join("") + '/tax_id.png');
        }

        response.json({
            success: true,
            data: {
                documents: documents
            }
        });
    },

    drop_document: (request, response) => {

        const document_type = request.body.document_type ?? "";
        const manager_id    = request.body.manager_id;

        if(!manager_id){
            response.json({
                success: false,
                errors: ["manager_id cannot be null"]
            });
            return;
        }

        if(document_type !== "identity_card" && document_type !== "drivers_license" && document_type !== "tax_id"){
            response.json({
                success: false,
                errors: ["document_type must be identity_card, drivers_license or tax_id"]
            });
            return;
        }

        const path = `./storage/gs_manager/manager_${manager_id}/documents/${document_type}.png`;
        if(fs.existsSync(path)){
            try{
                fs.unlinkSync(path);
            }catch(e){
                response.json({
                    success: false,
                    errors: [e.message]
                });
                return;
            }
        }

        response.json({
            success: true
        });
        
    },

    get_documents_metadata: (request, response) => {

        const manager_id = request.body.manager_id;

        if(!manager_id){
            response.json({
                success: false,
                errors: ["manager_id cannot be null"]
            });
            return;
        }        

        const path = `./storage/gs_manager/manager_${manager_id}/documents`;
        let metadata_documents = [];
        if(fs.existsSync(path)){
            let docs = fs.readdirSync(path);
            docs.forEach(document => metadata_documents.push(document.split(".png").join("")));
        }

        response.json({
            success: true,
            data: {
                metadata_documents: metadata_documents
            }
        });
    },

    create_parking_space: (request, response) => {

        const garage_id             = request.body.garage_id;
        const id                    = request.body.id;
        const code_space            = request.body.code_space;
        const type_space            = request.body.type_space;
        const additional_info       = request.body.additional_info;
        const hourly_cost           = (request.body.hourly_cost ?? "0.00").toString();

        if(!garage_id){
            response.json({
                success: false,
                errors: ["garage_id cannot be null"]
            });
            return;
        }

        if(code_space && type_space && hourly_cost){
            
            if(type_space == "4_wheels" || type_space == "2_wheels" || type_space == "4_2_wheels"){

                if(isNaN(hourly_cost)){
                    response.json({
                        success: false,
                        errors: ["hourly_cost must be a number"]
                    });
                    return;
                }

                if(parseFloat(hourly_cost) >= 0.50){

                    let array_values = [code_space, type_space, hourly_cost, additional_info, garage_id];
                    let query = 
                        `
                            INSERT INTO gs_parking_space 
                                (
                                    code_space,
                                    type_space,
                                    hourly_cost,
                                    additional_info,
                                    id_gs_garage
                                )
                            VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    ?
                                )
                        `;
                    if(id){
                        array_values.push(id);
                        query = 
                            `
                                UPDATE gs_parking_space SET
                                    code_space          = ?,
                                    type_space          = ?,
                                    hourly_cost         = ?,
                                    additional_info     = ?,
                                    id_gs_garage        = ?
                                        WHERE
                                            id = ?
                            `;
                    }

                    db_core.db_core.get_connection(
                        (connection, pool) => {

                            connection.query(
                                query,
                                array_values,
                                (error, result, fields) => {

                                    pool.releaseConnection(connection);

                                    if(error){
                                        response.json({
                                            success: false,
                                            errors: [error.message]
                                        });
                                        return;
                                    }

                                    const inserted_id = !id ? result.insertId : id;
                                    if(inserted_id){
                                        response.json({
                                            success: true,
                                            data: {
                                                id: inserted_id
                                            }
                                        });
                                    }else{
                                        response.json({
                                            success: false,
                                            errors: ["insertId is null"]
                                        });
                                    }

                                }
                            )

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
                        errors: ["hourly_cost must be >= 0.50"]
                    });
                }

            }else{
                response.json({
                    success: false,
                    errors: ["type_space must be 4_wheels, 2_wheels or 4_2_wheels"]
                });
            }

        }else{
            response.json({
                success: false,
                errors: ["code_space, type_space e hourly_cost cannot be null"]
            });
        }

    },

    get_parking_spaces: (request, response) => {

        const garage_id = request.body.garage_id;

        if(!garage_id){
            response.json({
                success: false,
                errors: ["garage_id cannot be null"]
            });
            return;
        }

        db_core.db_core.get_connection(
            (connection, pool) => {

                connection.query(
                    `
                        SELECT 
                            id, 
                            code_space, 
                            type_space, 
                            hourly_cost, 
                            additional_info 
                        FROM 
                            gs_parking_space 
                                WHERE 
                                    id_gs_garage = ${garage_id}
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

                        let parking_spaces = [];
                        rows.forEach(row => {
                            parking_spaces.push(
                                {
                                    id              : row.id,
                                    code_space      : row.code_space,
                                    type_space      : row.type_space,
                                    hourly_cost     : row.hourly_cost,
                                    additional_info : row.additional_info
                                }
                            );
                        });

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

    }

};

exports.manager_routes = manager_routes;