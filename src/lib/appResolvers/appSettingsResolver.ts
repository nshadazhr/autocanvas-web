import { localAppSettings } from '@/src/appDefaults';

type LocalAppSettings = typeof localAppSettings;

type AppSettingsKey = {
	[N in keyof LocalAppSettings]: keyof LocalAppSettings[N];
}[keyof LocalAppSettings] &
	string;

type AppSettingsValue<K extends AppSettingsKey> = {
	[N in keyof LocalAppSettings]: K extends keyof LocalAppSettings[N]
		? LocalAppSettings[N][K] extends boolean
			? boolean
			: LocalAppSettings[N][K] extends number
				? number
				: LocalAppSettings[N][K] extends string
					? string
					: never
		: never;
}[keyof LocalAppSettings];

export type RemoteAppSettings = Partial<{
	[K in AppSettingsKey]: AppSettingsValue<K>;
}>;

const globalAppSettings: Record<string, string | number | boolean> = {};

for (const [group, settings] of Object.entries(localAppSettings)) {
	for (const [key, value] of Object.entries(settings)) {
		if (Object.prototype.hasOwnProperty.call(globalAppSettings, key)) {
			throw new Error(`Duplicate app setting key "${key}" found in "${group}".`);
		}

		globalAppSettings[key] = value;
	}
}


/**
 * Global App Settings resolver.
 * Priority: Admin Dashboard > Local App Settings
 */
export function getAppSettings(
	remoteAppSettings: RemoteAppSettings = {}
  ) {
	return <K extends AppSettingsKey>(
	  key: K
	): AppSettingsValue<K> => {
	  const localValue = globalAppSettings[key];
	  const remoteValue = remoteAppSettings[key];
  
	  if (typeof remoteValue === typeof localValue) {
		return remoteValue as AppSettingsValue<K>;
	  }
  
	  return localValue as AppSettingsValue<K>;
	};
  }
  
