const express               = require('express');
const route_auth            = require('./routes/auth');
const route_manager         = require('./routes/manager');
const route_final_user      = require('./routes/final_user');
const route_utility         = require('./routes/utility');
const route_google          = require('./routes/google');
const route_admin_panel     = require('./routes/admin_panel');
const route_async_procedure = require('./routes/async_procedure');
const route_email           = require('./routes/email_core');
const cron                  = require('node-cron');
const app                   = express();

// ===================================================================
// Eccezioni non gestite
// ===================================================================
process.on('unhandledRejection', (e) => {
    console.log("=========");
    console.log("ERROR");
    console.log(e);
    console.log("=========");
});

// ===================================================================
// Rotte escluse da controllo bearer
// ===================================================================
const excluded_paths_checks = [
    "/api/garage_sharing/v1/auth/get_token",
    "/api/garage_sharing/v1/auth/check_token",
    "/api/garage_sharing/v1/auth/refresh_token"
];

// ===================================================================
// Utilizzi vari e middlewares
// ===================================================================

app.use(express.json({limit: "50mb"}));
app.use(express.static("./storage"));

app.use((request, response, next) => {
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'content-type,X-Requested-With,authorization,Authorization');
    response.setHeader('Access-Control-Allow-Credentials', true);

    if(request.method == "OPTIONS"){
        response.sendStatus(200);
        return;
    }

    if(excluded_paths_checks.includes(request.path)){
       next(); 
    }else{
        route_auth.auth_routes.check_token(request, response, false, () => next(), () => response.sendStatus(401));
    }

});

// ===================================================================
// Auth Routes
// Rotte per la gestione delle autenticazione
// ===================================================================

app.post("/api/garage_sharing/v1/auth/get_token",                               route_auth.auth_routes.get_token);
app.post("/api/garage_sharing/v1/auth/check_token",                             route_auth.auth_routes.check_token);
app.post("/api/garage_sharing/v1/auth/refresh_token",                           route_auth.auth_routes.refresh_token);

// ===================================================================
// Final User Routes
// Rotte per il cliente
// ===================================================================
app.post('/api/garage_sharing/v1/final_user/create',                            route_final_user.final_user_routes.create);
app.post('/api/garage_sharing/v1/final_user/login',                             route_final_user.final_user_routes.login);
app.post('/api/garage_sharing/v1/final_user/get_final_user_data',               route_final_user.final_user_routes.get_final_user_data);
app.post('/api/garage_sharing/v1/final_user/set_profile_image',                 route_final_user.final_user_routes.set_profile_image);
app.post('/api/garage_sharing/v1/final_user/book_parking',                      route_final_user.final_user_routes.book_parking);
app.post('/api/garage_sharing/v1/final_user/region_points_garages',             route_final_user.final_user_routes.region_points_garages);
app.post('/api/garage_sharing/v1/final_user/get_garage_details',                route_final_user.final_user_routes.get_garage_details);
app.post('/api/garage_sharing/v1/final_user/is_available_parking_space',        route_final_user.final_user_routes.is_available_parking_space);
app.post('/api/garage_sharing/v1/final_user/get_availables_parking_spaces',     route_final_user.final_user_routes.get_availables_parking_spaces);

// ===================================================================
// Manager Routes
// Rotte per il manager
// ===================================================================

app.post('/api/garage_sharing/v1/manager/create',                               route_manager.manager_routes.create);
app.post('/api/garage_sharing/v1/manager/login',                                route_manager.manager_routes.login);
app.post('/api/garage_sharing/v1/manager/set_profile_image',                    route_manager.manager_routes.set_profile_image);
app.post('/api/garage_sharing/v1/manager/get_manager_data',                     route_manager.manager_routes.get_manager_data);
app.post('/api/garage_sharing/v1/manager/create_garage',                        route_manager.manager_routes.create_garage);
app.post('/api/garage_sharing/v1/manager/upload_garage_images',                 route_manager.manager_routes.upload_garage_images);
app.post('/api/garage_sharing/v1/manager/get_manager_garages',                  route_manager.manager_routes.get_manager_garages);
app.post('/api/garage_sharing/v1/manager/upload_documents',                     route_manager.manager_routes.upload_documents);
app.post('/api/garage_sharing/v1/manager/drop_document',                        route_manager.manager_routes.drop_document);
app.post('/api/garage_sharing/v1/manager/get_documents_metadata',               route_manager.manager_routes.get_documents_metadata);
app.post('/api/garage_sharing/v1/manager/create_parking_space',                 route_manager.manager_routes.create_parking_space);
app.post('/api/garage_sharing/v1/manager/get_parking_spaces',                   route_manager.manager_routes.get_parking_spaces);
app.post('/api/garage_sharing/v1/manager/set_garage_close_status',              route_manager.manager_routes.set_garage_close_status);

// ===================================================================
// Api utility
// Rotte per svolgere operazione utilitarie
// ===================================================================
app.post('/api/garage_sharing/v1/utility/disable_entity',                       route_utility.utility_routes.disable_entity);
app.post('/api/garage_sharing/v1/utility/get_regions',                          route_utility.utility_routes.get_regions);
app.post('/api/garage_sharing/v1/utility/get_provinces',                        route_utility.utility_routes.get_provinces);
app.post('/api/garage_sharing/v1/utility/generate_email_checker',               route_utility.utility_routes.generate_email_checker);
app.post('/api/garage_sharing/v1/utility/check_random_code',                    route_utility.utility_routes.check_random_code);

// ===================================================================
// Api google
// Rotte per svolgere operazione con tramite google
// ===================================================================
app.post('/api/garage_sharing/v1/google/get_data_from_coordinates',             route_google.google_routes.get_data_from_coordinates);

// ===================================================================
// Processi asincroni
// ===================================================================
app.post('/api/garage_sharing/v1/async_procedure/create_to_weld',               route_async_procedure.async_procedure_routes.create_to_weld);

// ===================================================================
// Servizio email
// ===================================================================
app.post("/api/garage_sharing/v1/mail_service/dispatch",                        route_email.email_routes.dispatch);

// ===================================================================
// Cron
// 1) Da saldare
// ===================================================================
cron.schedule("*/30 * * * *", () => {

    const now = new Date().toLocaleDateString();
    console.log("Running scheduler", now);

    // ===================================================================
    // 1
    // ===================================================================
    route_async_procedure.async_procedure_routes.create_to_weld();

});

// Listening
app.listen(3000, () => {
    const now = new Date().toISOString();
    console.log("Garage sharing app runnig", now);
});