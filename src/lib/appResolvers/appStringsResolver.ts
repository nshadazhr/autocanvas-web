import { localStrings } from '../../appDefaults/localStrings';

type LocalStrings = typeof localStrings;

type StringKey = {
	[N in keyof LocalStrings]: keyof LocalStrings[N];
}[keyof LocalStrings] &
	string;

export type RemoteStrings = Partial<Record<StringKey, string>>;

const globalStrings: Record<string, string> = {};

for (const [group, strings] of Object.entries(localStrings)) {
	for (const [key, value] of Object.entries(strings)) {
		if (Object.prototype.hasOwnProperty.call(globalStrings, key)) {
			throw new Error(`Duplicate string key "${key}" found in "${group}".`);
		}

		globalStrings[key] = value;
	}
}

/**
 * Global string resolver.
 * Priority: Remote String > Local String
 */
export function getStrings(remoteStrings: RemoteStrings = {}) {
	return (key: StringKey): string => {
		const remoteValue = remoteStrings[key];

		if (typeof remoteValue === 'string' && remoteValue.trim() !== '') {
			return remoteValue;
		}

		return globalStrings[key] ?? key;
	};
}
