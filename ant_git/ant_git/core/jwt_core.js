const jwt = require('jsonwebtoken');

const jwt_core = {

    encrypt: () => {
        const bearer = jwt.sign({is_valid_json_web_token: true}, "917d8e42-f8ce-41a6-9f39-8d30ef1f6d2d", {expiresIn: "1d"});
        return bearer;
    },

    validate: (bearer, success, error) => {
        jwt.verify(bearer, "917d8e42-f8ce-41a6-9f39-8d30ef1f6d2d", (err, decoded) => {
            if(err){
                error(err);
            }else{
                success();
            }
        });
    }

};

exports.jwt_core = jwt_core;