// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

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
    let status;
    let body = {};
    
    try {
        console.log(event);
        let actual_event = event.body;
        console.log(actual_event)
        let info = JSON.parse(actual_event);
        console.log(info)
        
        let email = info['arg1'];
        let password = info['arg2'];
        console.log(email)
        console.log(password)
        
        if(email == "patflan"){
            if (password == "flan"){
                status = 200;
                body["result"] = "Good Username and Password"
            }        
            
        } else{
            status = 402;
            body["error"] = "Incorrect Username or Password";
        }
        


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
