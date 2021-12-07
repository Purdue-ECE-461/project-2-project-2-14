class Req {
    constructor(params, query, body, headers) {
        this.params = params;
        this.query = query;
        this.body = body;
        this.headers = headers;
    }
}

module.exports = Req;
