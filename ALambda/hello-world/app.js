// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const mysql = require('mysql');

var config = require('./config.json');
var pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});


function query(conx, sql, params){
    return new Promise((resolve, reject) => {
        conx.query(sql, params, function(err, rows){
            if(err){
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
}


/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @pmaram {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
 
 
exports.lambdaHandler = async (event, context) => {
    let status = 400;
    let body = {};
    var userpasswords = {};
    console.log("Login or Register!")
    
    try {
        //console.log(event);
        let actual_event = event.body;
        //console.log(actual_event)
        let info = JSON.parse(actual_event);
        //console.log(info)
        
        let email = info['arg1'];
        let password = info['arg2'];
        let LoginOrRegister = info['arg3'];
        console.log("email : ", email)
        console.log("password : ", password)
        console.log("LoginOrRegister : ", LoginOrRegister)
        
        let ListDesigners = (username) => {
            console.log('gets hungup here?');
            return new Promise((resolve,reject) => {
                pool.query("SELECT * FROM Register WHERE username=?", [username], (error, rows) => {
                    if(error) {return reject("Unable to list Projects");}
                    else {
                        return resolve(rows);
                    }
                });
            })}
            
        let InsertNewDesigner = (username, password) => {
            console.log("inserting new designer");
            return new Promise((resolve,reject) => {
                pool.query("INSERT INTO Register (username,password) VALUES(?,?)", [username, password], (error, rows) => {
                    if(error) {return reject("Unable to list Projects");}
                    else {
                        console.log("Sucess");
                        return resolve(true);
                    }
                });
            });}    
            
            
        try {
            console.log('how about here?');
            if(LoginOrRegister == 'R'){
                console.log("LoR = R");
                const registereddesigner = await InsertNewDesigner(email, password);
                console.log("finished inserting new designer");
            }
            
            if(LoginOrRegister == 'L'){
                const designers = await ListDesigners(info.username);
                if(designers.length != 0) {
                    response.statusCode=  200;
                    response.result = designers ;
                } else {
                    response.statusCode = 400;
                    response.error = "There are no registered designers with this username";
                }
            }    
                

        } catch (error) {
            response.statusCode = 400;
            response.error = error;
        }
        
        //console.log(response);
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        //------------------------------------Below only logs into patflan --------
        // if(email == "patflan"){
        //     if (password == "flan"){
        //         status = 200;
        //         body["result"] = "Good Username and Password"
        //     }        
            
        // } else{
        //     status = 402;
        //     body["error"] = "Incorrect Username or Password";
        // }
        
        //---------------------------------------------------Only can register users ------------
        
        // if(LoginOrRegister == 'L'){
        //     console.log("attempting to log in")
        //     for(var username in userpasswords) {
        //       var passkey = userpasswords[username];
        //         if(username == email){
        //             if(passkey == password){
        //                 status = 200;
        //                 body["result"] = "Found Username and Password"
        //             }
        //         }
        //     }
        // }
        
        // if(LoginOrRegister == 'R'){
        //     console.log("attempting to Register")
        //     for(var username in userpasswords) {
        //       var passkey = userpasswords[username];
        //         if(username == email){
        //             console.log("Already Registered")
        //             status = 403;
        //             body["result"] = "Already Registered"
                    
        //                 response = {
        //                     'statusCode': status,
                            
        //                     headers: {
        //                         "Access-Control-Allow-Headers" : "Content-Type",
        //                         "Access-Control-Allow-Origin" : "'", // Allow from anywhere
        //                         "Access-Control-Allow-Methods" : "POST" // Allow Post request
        //                     },
                            
        //                     'body' : JSON.stringify(body)
        //                 };
        //             return response

        //         }
        //     }
        //     userpasswords[email] = password;
        //     status = 200;
        //     body["result"] = "Found Username and Password"
        // }

// -----------------------------------------------------------------------------




    } catch (err) {
        console.log(err);
        status = 401;
        body["error"] = err.toString();
    }
    
    
    
        response = {
        'statusCode': status,
        
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin" : "'", // Allow from anywhere
            "Access-Control-Allow-Methods" : "POST" // Allow Post request
        },
        
        'body' : JSON.stringify(body)
    };

    return response
};
