"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function assignFlightDiscriminator(flight) {
    if (flight) {
        if (flight.comingFrom)
            Object.assign(flight, { direction: 'Arriving' });
        else
            Object.assign(flight, { direction: 'Departing' });
    }
}
exports.assignFlightDiscriminator = assignFlightDiscriminator;
function getInnerArray(array) {
    let innerArray = array;
    while (innerArray[0] instanceof Array)
        innerArray = innerArray[0];
    return innerArray;
}
exports.getInnerArray = getInnerArray;
//# sourceMappingURL=utils.js.map