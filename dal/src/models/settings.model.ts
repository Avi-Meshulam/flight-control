import { model, Schema } from 'mongoose';
import { rangeSchema } from '../shared/schemas';

enum SafetyMode {
	Pessimistic,
	Optimistic,
	Risky
}

// enum YesNoOption {
// 	Yes = 'Yes',
// 	No = 'No'
// }

// const yesNoOption = Object.keys(YesNoOption);

// simulatorSettings schema
const simulatorSettingsSchema = new Schema({
	intervalRange: { type: rangeSchema }
}, { _id: false });

// Settings schema
const settingsSchema = new Schema({
	speedPercentageRange: { type: rangeSchema },
	safetyMode: { type: Number, enum: SafetyMode },
	radioResponseTime: Number,
	simulatorSettings: { type: simulatorSettingsSchema }
});

// Settings Model
export const SettingsModel = model('settings', settingsSchema, 'settings');
