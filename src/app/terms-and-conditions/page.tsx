import Link from 'next/link';

export const metadata = {
	title: 'Terms & Conditions | AutoCanvas',
	description: 'Terms and Conditions for using AutoCanvas.'
};

const sections = [
	{
		title: '1. Acceptance of Terms',
		paragraphs: [
			'By accessing or using AutoCanvas, you agree to these Terms & Conditions. If you do not agree, please do not use the service.',
			'You must have the legal capacity to agree to these terms, or obtain any consent required under applicable law.'
		]
	},
	{
		title: '2. Accounts and Sign-In',
		paragraphs: [
			'You may sign in using supported methods, including email and Google Sign-In. You are responsible for maintaining the security of your account and for activity conducted through it.',
			'You must provide accurate information and must not access another person’s account without authorization.'
		]
	},
	{
		title: '3. Use of AI Features',
		paragraphs: [
			'AutoCanvas may offer tools for generating or editing audio, images, video, and other creative content. AI-generated results can be inaccurate, incomplete, or similar to content generated for others. Review outputs before using or publishing them.',
			'You are responsible for your prompts, uploaded materials, generated outputs, and ensuring that your use complies with applicable laws and third-party rights.'
		]
	},
	{
		title: '4. Acceptable Use',
		paragraphs: [
			'Do not use AutoCanvas to violate laws, infringe intellectual property or privacy rights, impersonate others, distribute malware, interfere with the service, or attempt unauthorized access.',
			'We may restrict access or remove content where reasonably necessary to address violations, security risks, or legal obligations.'
		]
	},
	{
		title: '5. Content and Intellectual Property',
		paragraphs: [
			'You retain any rights you already hold in content you submit. You must have permission to upload and use that content.',
			'Rights in AI-generated outputs may vary depending on applicable law, third-party provider terms, and the features used. AutoCanvas does not guarantee that any output is unique or eligible for copyright protection.',
			'AutoCanvas branding, software, and service materials remain protected by applicable intellectual property laws.'
		]
	},
	{
		title: '6. Plans, Payments, and Limits',
		paragraphs: [
			'Certain features may have usage limits or require payment. Any applicable prices, renewal terms, cancellation rules, and refund conditions should be presented to you before purchase.',
			'Do not rely on this section as a description of a paid plan unless a paid plan has actually been launched.'
		]
	},
	{
		title: '7. Availability and Changes',
		paragraphs: [
			'We may update, suspend, or discontinue features. We aim to maintain reliable service but cannot guarantee uninterrupted or error-free availability.',
			'We may revise these terms from time to time. Material changes will be communicated as required by applicable law.'
		]
	},
	{
		title: '8. Disclaimers and Liability',
		paragraphs: [
			'AutoCanvas is provided subject to applicable law and any warranties that cannot legally be excluded. AI-generated content should not be treated as professional, legal, medical, or financial advice.',
			'Any limitation of liability must comply with applicable consumer protection and other mandatory laws.'
		]
	},
	{
		title: '9. Suspension and Termination',
		paragraphs: [
			'You may stop using the service at any time. We may suspend or terminate accounts for serious or repeated violations, security threats, or legal requirements, subject to applicable law.',
			'Account and personal-data deletion requests are addressed under our Privacy Policy and applicable law.'
		]
	},
	{
		title: '10. Privacy',
		paragraphs: [
			'Our Privacy Policy explains how personal information is collected, used, and handled when you use AutoCanvas.'
		]
	},
	{
		title: '11. Contact and Legal Details',
		paragraphs: [
			'Before publishing these terms, add the legal name of the service operator, a working support/contact email, the applicable jurisdiction, and any required consumer or grievance contact information.'
		]
	}
];

export default function TermsAndConditionsPage() {
	return (
		<main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">
			<div className="mx-auto max-w-3xl">
				<Link href="/login" className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200">
					← Back to Login
				</Link>

				<header className="mt-8 mb-10">
					<p className="mb-3 text-sm font-semibold tracking-widest text-indigo-400 uppercase">AutoCanvas</p>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms & Conditions</h1>
					<p className="mt-4 text-sm leading-6 text-slate-400">
						Please read these terms before using AutoCanvas.
					</p>
				</header>

				<div className="space-y-8">
					{sections.map(section => (
						<section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
							<h2 className="mb-3 text-lg font-semibold text-white">{section.title}</h2>
							<div className="space-y-3 text-sm leading-7 text-slate-300">
								{section.paragraphs.map(paragraph => (
									<p key={paragraph}>{paragraph}</p>
								))}
							</div>
						</section>
					))}
				</div>

				<footer className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
					<Link href="/privacy-policy" className="text-indigo-300 hover:text-indigo-200">
						Privacy Policy
					</Link>
					<p className="mt-3">Draft for review. Complete business and legal details before publication.</p>
				</footer>
			</div>
		</main>
	);
}
