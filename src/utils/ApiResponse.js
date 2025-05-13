// this done so that if we forget to give any status or message while writing Apis then it will give the standard response. 
class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data 
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }