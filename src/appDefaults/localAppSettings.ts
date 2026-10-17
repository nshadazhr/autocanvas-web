export const localAppSettings = {
	features: {
		enableAudioStudio: true,
		enableVideoStudio: false,
		enableImageStudio: true,
		enableRegistration: true,

		// Authentication
		enableGoogleLogin: true,
		enableEmailLogin: true,
		enableFacebookLogin: false,
		enablePhoneOtpLogin: false
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
