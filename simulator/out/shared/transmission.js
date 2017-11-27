"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ReplyCode;
(function (ReplyCode) {
    ReplyCode["Affirmative"] = "Affirmative";
    ReplyCode["Negative"] = "Negative";
    ReplyCode["ComeIn"] = "Come In";
    ReplyCode["Roger"] = "Roger";
    ReplyCode["Over"] = "Over";
    ReplyCode["SayAgain"] = "Say Again";
    ReplyCode["Standby"] = "Standby";
    ReplyCode["Out"] = "Out";
})(ReplyCode = exports.ReplyCode || (exports.ReplyCode = {}));
class Transmission {
    constructor(from, to, message, replyCode = ReplyCode.Over, data) {
        this.from = from;
        this.to = to;
        this.message = message;
        this.replyCode = replyCode;
        this.data = data;
    }
    static createConfirmation(from, to) {
        return new Transmission(from, to, '', ReplyCode.Roger);
    }
    static isTransmission(transmission) {
        return transmission && transmission.from && transmission.to && transmission.replyCode;
    }
    static stringify(data) {
        if (Transmission.isTransmission(data))
            return `${data.to} from ${data.from}: ${data.message ? `${data.message}` : ''}${data.replyCode !== ReplyCode.Out ? data.message ? `, ${data.replyCode}.` : `${data.replyCode}.` : ''}\n`;
        else
            return JSON.stringify(data);
    }
}
exports.Transmission = Transmission;
//# sourceMappingURL=transmission.js.map