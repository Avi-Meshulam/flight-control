"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schemas_1 = require("../shared/schemas");
var SafetyMode;
(function (SafetyMode) {
    SafetyMode[SafetyMode["Pessimistic"] = 0] = "Pessimistic";
    SafetyMode[SafetyMode["Optimistic"] = 1] = "Optimistic";
    SafetyMode[SafetyMode["Risky"] = 2] = "Risky";
})(SafetyMode || (SafetyMode = {}));
// enum YesNoOption {
// 	Yes = 'Yes',
// 	No = 'No'
// }
// const yesNoOption = Object.keys(YesNoOption);
// simulatorSettings schema
const simulatorSettingsSchema = new mongoose_1.Schema({
    intervalRange: { type: schemas_1.rangeSchema }
}, { _id: false });
// Settings schema
const settingsSchema = new mongoose_1.Schema({
    speedPercentageRange: { type: schemas_1.rangeSchema },
    safetyMode: { type: Number, enum: SafetyMode },
    radioResponseTime: Number,
    simulatorSettings: { type: simulatorSettingsSchema }
});
// Settings Model
exports.SettingsModel = mongoose_1.model('settings', settingsSchema, 'settings');
//# sourceMappingURL=settings.model.js.map