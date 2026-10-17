'use client';

import { useEffect, useRef } from 'react';

type GoogleCredentialResponse = {
	credential: string;
};

type GoogleSignInButtonProps = {
	onSuccess: (idToken: string) => void;
};

export default function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
	const buttonRef = useRef<HTMLDivElement>(null);
	const onSuccessRef = useRef(onSuccess);
	onSuccessRef.current = onSuccess;

	useEffect(() => {
		const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

		if (!clientId || !buttonRef.current) {
			console.error('Google Client ID is missing');
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;

		script.onload = () => {
			const google = (
				window as Window & {
					google?: {
						accounts: {
							id: {
								initialize: (config: {
									client_id: string;
									callback: (response: GoogleCredentialResponse) => void;
								}) => void;
								renderButton: (
									element: HTMLElement,
									options: {
										theme: string;
										size: string;
										width: number;
									}
								) => void;
							};
						};
					};
				}
			).google;

			if (!google || !buttonRef.current) return;

			google.accounts.id.initialize({
				client_id: clientId,
				callback: response => {
					onSuccessRef.current(response.credential);
				}
			});

			google.accounts.id.renderButton(buttonRef.current, {
				theme: "filled_black",
				size: "large",
				width: Math.min(buttonRef.current.clientWidth, 400)
			});
		};

		document.head.appendChild(script);

		return () => {
			script.remove();
		};
	}, []);

	return <div ref={buttonRef} className="w-full" />;
}
