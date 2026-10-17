import { AudioStudioHero } from './audio-studio-hero';
import { AudioStudioDashboard } from './audio-studio-dashboard';

export default function AudioStudioPage() {
	return <AudioStudioDashboard hero={<AudioStudioHero />} />;
}
