import HomeHeader from '../components/home/HomeHeader';
import HomeHero from '../components/home/HomeHero';
import HomeChannels from '../components/home/HomeChannels';
import HomeTools from '../components/home/HomeTools';
import HomeStats from '../components/home/HomeStats';
import { getAppSettings } from '../lib/appResolvers';

export default function HomePage() {
	const appSettings = getAppSettings();
	return (
		<div className='min-h-screen bg-[#05050c] text-white'>
			<HomeHeader />
			<HomeHero />
			{appSettings('showChannels') && <HomeChannels />}
			<HomeTools />
			{appSettings('showStats') && <HomeStats />}
		</div>
	);
}
