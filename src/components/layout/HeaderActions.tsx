import { AuthLinkButton } from '../auth/AuthLinkButton';

export const HeaderActions = () => {
	return (
		<div className='flex items-center gap-3'>
			<span className='hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm sm:flex'>
				☀️
			</span>

			<AuthLinkButton />
		</div>
	);
};
