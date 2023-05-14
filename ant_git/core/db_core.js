const mysql2 = require('mysql2');

const db_core = {

    get_pool: () => {

        const pool = 
            mysql2.createPool({
                host                : "localhost",
                user                : "root",
                password            : "ant070400",
                database            : "garage_sharing",
                waitForConnections  : true,
                connectionLimit     : 10,
                maxIdle             : 10,
                idleTimeout         : 60000, 
                queueLimit          : 0
            });
        
        return pool;
    },

    get_connection: (success, error) => {
        const pool = this.db_core.get_pool();
        pool.getConnection((err, connection) => {
            if(err){
                error(err);
            }else{
                if(connection){
                    success(connection, pool);
                }else{
                    error({message: "connection is null"});
                }
            }
        });
    }

};

exports.db_core = db_core;

// <Queries>
// create database garage_sharing;
// Disabilitazione entity: create index index_disabled_garage on gs_garage(disabled); ==> E' un esempio di indice
// create table gs_users (id int primary key auto_increment, client_id varchar(10) unique, client_secret varchar(10) unique, description varchar(25), disabled int default '0');
// create table gs_manager (id int primary key auto_increment, type_subject int, business_name varchar(250), first_name varchar(100), last_name varchar(100), vat_number varchar(30), fiscal_code varchar(30), email varchar(400) unique, password varchar(500), stripe_private_key varchar(400) unique, stripe_public_key varchar(400) unique, disabled int default '0');
// create table gs_garage (id int primary key auto_increment, title varchar(200) not null, subtitle varchar(200), info_point varchar(200), region varchar(30) not null,  province varchar(2) not null, city varchar(80) not null, cap varchar(10) not null, address varchar(250) not null, latitude double default 0, longitude double default 0, id_gs_manager int not null, disabled int default '0', foreign key(id_gs_manager) references gs_manager(id) on delete cascade);
// creazione indici per title, region, province, city, cap, address
// create table gs_parking_space (id int primary key auto_increment, code_space varchar(10), type_space varchar(15), hourly_cost double default 0.00, additional_info varchar(200), id_gs_garage int not null, disabled int default '0', foreign key(id_gs_garage) references gs_garage(id));
// creazione inidici per type_space, hourly_cost