"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    static delay(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
exports.default = Utils;
//# sourceMappingURL=utils.js.map