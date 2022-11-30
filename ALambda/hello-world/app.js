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
        let info = JSON.parse(actual_event);
        let number = 1;
        
        let email = event.arg1;
        let password = event.arg2;
        
        if(email == "patflan"){
            if (password == flan){
                status = 200
            }        
            
        } else{
            status = 400;
            body["Incorrect Username or Password"]
        }
        
        // const ret = await axios(url);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                result: number,
                // location: ret.data.trim()
            })
        }
    } catch (err) {
        console.log(err);
        status = 400;
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
