class Res {
    status(number) {
        this._status = number;
        this._response = null;
        return this;
    }

    send(str) {
        this._response = str;
        return `${this._status}: ${str}`;
    }

    json(json) {
        this._response = json;
        return `${this._status}: ${JSON.stringify(json)}`;
    }
}

module.exports = Res;
