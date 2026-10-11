import Link from 'next/link';

export const metadata = {
	title: 'Privacy Policy | AutoCanvas',
	description: 'Learn how AutoCanvas handles your personal information.'
};

export default function PrivacyPolicyPage() {
	return (
		<main className="min-h-screen bg-[#05050c] px-6 py-12 text-white">
			<div className="mx-auto max-w-3xl">
				<Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">
					← Back to AutoCanvas
				</Link>

				<h1 className="mt-8 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
				<p className="mt-3 text-sm text-slate-400">Last updated: October 11, 2026</p>

				<div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">
					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">1. About this policy</h2>
						<p>
							This policy explains how AutoCanvas handles personal information when you create an account,
							sign in, or use the platform. Details about the legal operator and contact information
							should be completed before publication.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">2. Information we collect</h2>
						<p>
							Depending on how you use AutoCanvas, account information may include your name, email
							address, account identifiers, and authentication-related information. If you sign in with
							Google, Google may provide basic profile information and an identity token used to verify
							your sign-in. AutoCanvas does not receive your Google account password through Google
							Sign-In.
						</p>
						<p className="mt-3">
							Before publishing, add any other information your application actually collects, such as
							uploaded content, generated projects, usage analytics, device information, payment
							information, or support messages.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">3. How information is used</h2>
						<p>
							Account information is used to authenticate users, maintain sessions, provide requested
							platform features, protect accounts, and respond to support requests. Any additional uses,
							such as analytics, personalization, marketing, or AI processing, must be disclosed here if
							enabled.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">4. Google Sign-In</h2>
						<p>
							Google Sign-In helps verify your identity. Basic sign-in does not itself grant AutoCanvas
							access to your Gmail, Google Drive, or other Google services. Access to additional Google
							services would require a separate authorization flow.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">5. Cookies and sessions</h2>
						<p>
							AutoCanvas uses authentication-related cookies or tokens to keep you signed in and help
							protect your session. Add details of any analytics, advertising, or other non-essential
							cookies if your production application uses them.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">6. Sharing and service providers</h2>
						<p>
							Information may be processed by service providers necessary to operate the platform, such as
							hosting, authentication, storage, or AI service providers. Before publication, identify the
							relevant provider categories, purposes, and any applicable international data transfers. Do
							not claim that data is never shared unless that is verified.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">7. Security and retention</h2>
						<p>
							AutoCanvas should apply reasonable technical and organizational safeguards. Personal
							information should be retained only for documented purposes and periods. Specify your actual
							retention periods and deletion practices before publication.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">8. Your choices and requests</h2>
						<p>
							Depending on applicable law, you may have rights to access, correct, or request deletion of
							personal information and withdraw certain consents. Provide a working contact method and
							explain the account deletion process before publication.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">9. Children</h2>
						<p>
							Before publication, specify the intended minimum user age and how you handle accounts or
							personal information relating to minors under applicable laws.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">10. Changes to this policy</h2>
						<p>
							This policy may be updated as the platform changes. The updated version should be posted
							here with a revised effective date and any legally required notices.
						</p>
					</section>

					<section>
						<h2 className="mb-2 text-xl font-semibold text-white">11. Contact</h2>
						<p>
							Before publication, add the legal business name, privacy contact email, and other contact or
							grievance information required by applicable law.
						</p>
					</section>
				</div>
			</div>
		</main>
	);
}
