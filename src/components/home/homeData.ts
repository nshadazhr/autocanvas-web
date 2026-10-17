export const NAV_LINKS = [
	{ labelKey: 'navTools', href: '#tools' },
	{ labelKey: 'navFeatures', href: '#tools' },
	{ labelKey: 'navTemplates', href: '#' },
	{ labelKey: 'navPricing', href: '#' },
	{ labelKey: 'navFaqs', href: '#' }
] as const;

export const CHECKLIST = ['checklistNoTechnicalSkills', 'checklistCreateInMinutes', 'checklistCreatorsCount'] as const;

export const FLOATING_CARDS = [
	{ labelKey: 'floatingCharacters', emoji: '🧑‍🤝‍🧑', className: 'left-2 top-4 sm:left-4 sm:top-6 -rotate-3' },
	{ labelKey: 'floatingScripts', emoji: '📄', className: 'right-2 top-0 sm:right-4 rotate-3' },
	{ labelKey: 'floatingBackgrounds', emoji: '🏞️', className: 'left-0 top-1/2 -translate-y-1/2 sm:left-2 -rotate-2' },
	{ labelKey: 'floatingThumbnails', emoji: '🖼️', className: 'right-0 top-1/3 sm:right-2 rotate-2' },
	{ labelKey: 'floatingVoices', emoji: '🎙️', className: 'left-4 bottom-2 sm:left-8 rotate-2' },
	{ labelKey: 'floatingVideos', emoji: '🎬', className: 'right-4 bottom-0 sm:right-8 -rotate-3' }
] as const;

export const CHANNELS = [
	{ nameKey: 'toonKahaniName', viewsKey: 'toonKahaniViews', emoji: '🧑' },
	{ nameKey: 'moralStoriesTvName', viewsKey: 'moralStoriesTvViews', emoji: '👩' },
	{ nameKey: 'villageTalesName', viewsKey: 'villageTalesViews', emoji: '🏡' },
	{ nameKey: 'kidsFunName', viewsKey: 'kidsFunViews', emoji: '🦒' },
	{ nameKey: 'storyWorldName', viewsKey: 'storyWorldViews', emoji: '🧒' },
	{ nameKey: 'desiKahaniName', viewsKey: 'desiKahaniViews', emoji: '🏠' }
] as const;

export const TOOLS = [
	{
		titleKey: 'scriptStudioTitle',
		descriptionKey: 'scriptStudioDescription',
		emoji: '📝',
		tint: 'bg-blue-500/15 text-blue-300'
	},
	{
		titleKey: 'imageStudioTitle',
		descriptionKey: 'imageStudioDescription',
		emoji: '🖼️',
		tint: 'bg-purple-500/15 text-purple-300'
	},
	{
		titleKey: 'audioStudioTitle',
		descriptionKey: 'audioStudioDescription',
		emoji: '🎵',
		tint: 'bg-emerald-500/15 text-emerald-300'
	},
	{
		titleKey: 'thumbnailStudioTitle',
		descriptionKey: 'thumbnailStudioDescription',
		emoji: '🖼',
		tint: 'bg-amber-500/15 text-amber-300'
	},
	{
		titleKey: 'videoStudioTitle',
		descriptionKey: 'videoStudioDescription',
		emoji: '▶️',
		tint: 'bg-blue-500/15 text-blue-300'
	},
	{
		titleKey: 'templatesTitle',
		descriptionKey: 'templatesDescription',
		emoji: '🧩',
		tint: 'bg-indigo-500/15 text-indigo-300'
	},
	{ titleKey: 'projectsTitle', descriptionKey: 'projectsDescription', emoji: '📁', tint: 'bg-sky-500/15 text-sky-300' },
	{
		titleKey: 'moreToolsTitle',
		descriptionKey: 'moreToolsDescription',
		emoji: '✨',
		tint: 'bg-violet-500/15 text-violet-300'
	}
] as const;

export const STATS = [
	{ labelKey: 'creatorsWorldwideLabel', valueKey: 'creatorsWorldwideValue', emoji: '👥' },
	{ labelKey: 'videosCreatedLabel', valueKey: 'videosCreatedValue', emoji: '▶️' },
	{ labelKey: 'creatorRatingLabel', valueKey: 'creatorRatingValue', emoji: '⭐' },
	{ labelKey: 'supportedLanguagesLabel', valueKey: 'supportedLanguagesValue', emoji: '🌐' }
] as const;
