const express       = require('express');
const route_auth    = require('./routes/auth');
const route_manager = require('./routes/manager');
const route_utility = require('./routes/utility');
const app           = express();

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

app.post("/api/garage_sharing/v1/auth/get_token",                   route_auth.auth_routes.get_token);
app.post("/api/garage_sharing/v1/auth/check_token",                 route_auth.auth_routes.check_token);
app.post("/api/garage_sharing/v1/auth/refresh_token",               route_auth.auth_routes.refresh_token);

// ===================================================================
// Manager Routes
// Rotte per il manager
// ===================================================================

app.post('/api/garage_sharing/v1/manager/create',                   route_manager.manager_routes.create);
app.post('/api/garage_sharing/v1/manager/login',                    route_manager.manager_routes.login);
app.post('/api/garage_sharing/v1/manager/set_profile_image',        route_manager.manager_routes.set_profile_image);
app.post('/api/garage_sharing/v1/manager/get_manager_data',         route_manager.manager_routes.get_manager_data);
app.post('/api/garage_sharing/v1/manager/create_garage',            route_manager.manager_routes.create_garage);
app.post('/api/garage_sharing/v1/manager/upload_garage_images',     route_manager.manager_routes.upload_garage_images);
app.post('/api/garage_sharing/v1/manager/get_manager_garages',      route_manager.manager_routes.get_manager_garages);
app.post('/api/garage_sharing/v1/manager/upload_documents',         route_manager.manager_routes.upload_documents);
app.post('/api/garage_sharing/v1/manager/drop_document',            route_manager.manager_routes.drop_document);
app.post('/api/garage_sharing/v1/manager/get_documents_metadata',   route_manager.manager_routes.get_documents_metadata);
app.post('/api/garage_sharing/v1/manager/create_parking_space',     route_manager.manager_routes.create_parking_space);
app.post('/api/garage_sharing/v1/manager/get_parking_spaces',       route_manager.manager_routes.get_parking_spaces);

// ===================================================================
// Api utility
// Rotte per svolgere operazione utilitarie
// ===================================================================
app.post('/api/garage_sharing/v1/utility/disable_entity',           route_utility.utility_routes.disable_entity);

// Listening
app.listen(3000, () => {
    console.log("Garage sharing app runnig");
});