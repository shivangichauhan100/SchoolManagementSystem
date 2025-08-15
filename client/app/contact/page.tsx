'use client'

import { useState } from 'react'

export default function ContactPage() {
	const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = e.currentTarget
		const formData = new FormData(form)
		setStatus('sending')
		try {
			await fetch('/api/contact', {
				method: 'POST',
				body: JSON.stringify(Object.fromEntries(formData as any)),
				headers: { 'Content-Type': 'application/json' },
			})
			setStatus('sent')
			form.reset()
		} catch {
			setStatus('error')
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-16">
			<div className="max-w-3xl mx-auto bg-white rounded-xl shadow border border-gray-100 p-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">Contact us</h1>
				<p className="text-gray-600 mb-8">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>

				<form onSubmit={submit} className="space-y-5">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
						<input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<input type="email" name="email" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
						<textarea name="message" required rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
					</div>
					<button className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700 transition-colors" disabled={status==='sending'}>
						{status==='sending' ? 'Sending...' : 'Send message'}
					</button>
					{status==='sent' && <p className="text-green-600">Message sent!</p>}
					{status==='error' && <p className="text-red-600">Failed to send message.</p>}
				</form>
			</div>
		</div>
	)
}


