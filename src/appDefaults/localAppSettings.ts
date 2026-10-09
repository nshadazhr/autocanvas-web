export const localAppSettings = {
	features: {
		enableAudioStudio: true,
		enableVideoStudio: false,
		enableImageStudio: true,
		enableRegistration: true
	},

	home: {
		showStats: true,
		showChannels: true
	},

	limits: {
		maxProjects: 10,
		maxAudioDuration: 300
	},

	app: {
		maintenanceMode: false,
		defaultLanguage: 'en'
	}
} as const;
