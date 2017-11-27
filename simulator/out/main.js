"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
require("rxjs/add/operator/delay");
require("rxjs/add/operator/retryWhen");
const socketIO = require("socket.io");
const transmission_1 = require("./models/transmission");
const simulator_1 = require("./simulator");
const utils_1 = require("./utils");
var OutgoingMessageType;
(function (OutgoingMessageType) {
    OutgoingMessageType["General"] = "general";
    OutgoingMessageType["FlightTransmission"] = "flight-transmission";
})(OutgoingMessageType || (OutgoingMessageType = {}));
const OBSERVABLE_RETRY_INTERVAL = 1000;
const SOCKET_RETRY_INTERVAL = 3000;
const IncomingMessageType = [
    'general',
    'direction',
    'leg-closed',
    'emergency',
    'settings'
];
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const io = socketIO(server);
const simulator = new simulator_1.Simulator();
const transmissions = simulator.getTransmissions().retryWhen(errors => errors.delay(OBSERVABLE_RETRY_INTERVAL));
io.on('connection', (socket) => {
    console.log('user connected\n');
    let subscription = transmissions.subscribe(transmission => sendFlightTransmission(socket, transmission), err => console.log(`error: ${err}`), () => console.log('flights pool exhausted'));
    socket.on('disconnect', () => {
        console.log('user disconnected\n');
        subscription.unsubscribe();
    });
    IncomingMessageType.forEach(messageType => socket.on(messageType, args => handleIncomingMessage(messageType, args)));
});
server.listen(port, () => {
    console.log(`Listening on port: ${port}\n`);
});
//#region Helper Functions
function sendFlightTransmission(socket, transmission) {
    console.log(transmission_1.Transmission.stringify(transmission));
    socket.emit(OutgoingMessageType.FlightTransmission, transmission, (response) => __awaiter(this, void 0, void 0, function* () {
        if (isValidResponse(transmission, response)) {
            console.log(transmission_1.Transmission.stringify(response));
        }
        else {
            // Resend transmission recursively until acknowledgment
            yield utils_1.default.delay(SOCKET_RETRY_INTERVAL);
            sendFlightTransmission(socket, createInvalidResponseTransmission(transmission, response));
        }
    }));
}
function handleIncomingMessage(messageType, args) {
    switch (messageType) {
        case 'direction':
            console.log(transmission_1.Transmission.stringify(args));
            simulator.deleteTransmission(args.data);
            break;
        case 'settings':
            simulator.applySettings(args);
            console.log(`Settings changed to: ${JSON.stringify(args)}\n`);
            break;
        default:
            console.log(`${messageType.replace('-', ' ')}${args ? `: ${JSON.stringify(args)}` : ''}`);
            break;
    }
}
function isValidResponse(transmission, response) {
    if (!transmission_1.Transmission.isTransmission(response))
        return false;
    if (response.from !== transmission.to ||
        response.to !== transmission.from ||
        (response.replyCode !== transmission_1.ReplyCode.Roger
            && response.replyCode !== transmission_1.ReplyCode.Standby
            && response.replyCode !== transmission_1.ReplyCode.Out))
        return false;
    return true;
}
function createInvalidResponseTransmission(orig_transmission, response) {
    let message;
    let replyCode = transmission_1.ReplyCode.SayAgain;
    if (response.replyCode === transmission_1.ReplyCode.SayAgain) {
        message = orig_transmission.message;
        replyCode = transmission_1.ReplyCode.Over;
    }
    return new transmission_1.Transmission(orig_transmission.from, orig_transmission.to, message, replyCode, orig_transmission.data);
}
//#endregion Helper Functions
//# sourceMappingURL=main.js.map