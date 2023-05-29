const axios = require('axios');
const keys  = require('../core/project_keys');

const google = {

    get_data_from_coordinates: (request, response) => {

        const latitude  = request.body.latitude;
        const longitude = request.body.longitude;

        if(!latitude || !longitude){
            response.json({
                success: false,
                errors: ["latitude, longitude are mandatory fields"]
            });
            return;
        }

        axios.default.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${keys.keys.google_key}`)
        .then(
            (response_axios) => {
                if(response_axios.status == 200){
                    
                    try{

                        const data = response_axios.data;

                        let region              = null;
                        let province            = null;
                        let postal_code         = null;
                        let cities              = [];

                        if(!data.results || data.results.length == 0){
                            response.json({
                                success: false,
                                errors: ["google results is empty"]
                            });
                            return;
                        }

                        const res = data.results[0];    
                        if(!res.address_components || res.address_components.length == 0){
                            response.json({
                                success: false,
                                errors: ["google results components is empty"]
                            });
                            return;
                        }

                        const components = res.address_components;
                        for(let component of components){
                            const types = component.types;
                            for(let type of types){

                                switch(type){
                                    case "administrative_area_level_1": {
                                        if(component.long_name){
                                            region = component.long_name.trim().toUpperCase();
                                        }
                                    } break;
                                    case "administrative_area_level_2": {
                                        if(component.short_name){
                                            province = component.short_name.trim().toUpperCase();
                                        }
                                    } break;
                                    case "postal_code": {
                                        if(component.short_name){
                                            postal_code = component.short_name.trim().toUpperCase();
                                        }
                                    } break;
                                    case "locality": {
                                        if(component.short_name){
                                            cities.push(component.short_name);
                                        }else{
                                            if(component.long_name){
                                                cities.push(component.long_name);
                                            }
                                        }
                                    } break;
                                    case "administrative_area_level_3": {
                                        if(component.short_name){
                                            cities.push(component.short_name);
                                        }else{
                                            if(component.long_name){
                                                cities.push(component.long_name);
                                            }
                                        }
                                    } break;
                                }

                            }
                        }


                        response.json({
                            success: true,
                            data: {
                                region          : region,
                                province        : province,
                                cities          : cities,
                                postal_code     : postal_code
                            }
                        });

                    }catch(error){
                        response.json({
                            success: false,
                            errors: [error.message]
                        });
                    }

                }else{
                    response.json({
                        success: false,
                        errors: ["google response is not 200"]
                    });
                }
            }
        )
        .catch(
            (error) => {
                response.json({
                    success: false,
                    errors: [error.message]
                });
            }
        )

    }

};

exports.google_routes = google;