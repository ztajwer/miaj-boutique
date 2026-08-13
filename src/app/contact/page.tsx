'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverflowX: html.style.overflowX,
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverflowX: body.style.overflowX,
      bodyOverflowY: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyPosition: body.style.position,
    };

    html.classList.add("detail-page-scroll");
    body.classList.add("detail-page-scroll");
    html.style.overflowX = "hidden";
    html.style.overflowY = "auto";
    html.style.height = "auto";
    body.style.overflowX = "hidden";
    body.style.overflowY = "auto";
    body.style.height = "auto";
    body.style.position = "relative";

    return () => {
      html.classList.remove("detail-page-scroll");
      body.classList.remove("detail-page-scroll");
      html.style.overflow = prev.htmlOverflow;
      html.style.overflowX = prev.htmlOverflowX;
      html.style.overflowY = prev.htmlOverflowY;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.overflowX = prev.bodyOverflowX;
      body.style.overflowY = prev.bodyOverflowY;
      body.style.height = prev.bodyHeight;
      body.style.position = prev.bodyPosition;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setFeedback('');

    try {
      // Simulate luxury submission loader delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mailtoLink = `mailto:Miajboutique.ae@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
      )}`;
      window.location.href = mailtoLink;

      setStatus('success');
      setShowSuccessModal(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setFeedback('Something went wrong.');
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 text-[#4d3424]">
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f6eee4]">
        <img
          src="/con.webp"
          alt="background"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90 sm:opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,250,245,0.45)_45%,rgba(248,239,231,0.78)_100%)]" />
      </div>

      {/* Back button absolutely positioned for a cleaner look on big screens */}
      <div className="absolute top-6 left-4 md:top-10 md:left-10 z-50">
        <Link
          href="/"
          className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#f0dcc1] bg-white/80 shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Back"
        >
          <span className="text-xl md:text-2xl text-[#b78a4f]">←</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md md:max-w-2xl flex flex-col gap-4">
        <div className="rounded-[20px] md:rounded-[30px] border border-[#e8caa9] bg-white/75 backdrop-blur-md p-6 md:p-10 shadow-[0_30px_60px_rgba(77,52,36,0.08)]">
          <div className="text-center">
            <div className="mx-auto w-36 md:w-44">
              <Image src="/logo.webp" alt="MIAJ Boutique" width={288} height={96} className="mx-auto" />
            </div>
            <h2
              className="mt-6 text-2xl md:text-3xl font-semibold text-[#b78a4f]"
              style={{ fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif" }}
            >
              Contact Us
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#6f5843]">
              We&apos;d love to hear from you! Send us a message and our team will get back to you soon.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <label className="relative block">
                <span className="sr-only">Name</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b08966]" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="#b08966" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 20c0-2.761 4.477-5 8-5s8 2.239 8 5" stroke="#b08966" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-[#e7cfb7] bg-white px-4 py-3 md:py-3.5 pl-12 outline-none transition focus:border-[#c8945d]"
                  placeholder="Username"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Email</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b08966]" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                    <path d="M3 8.5v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#b08966" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 8.5l-9 6-9-6" stroke="#b08966" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-[#e7cfb7] bg-white px-4 py-3 md:py-3.5 pl-12 outline-none transition focus:border-[#c8945d]"
                  placeholder="Email Address"
                />
              </label>
            </div>

            <label className="relative block">
              <span className="sr-only">Subject</span>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-[#e7cfb7] bg-white px-4 py-3 outline-none transition focus:border-[#c8945d]"
                placeholder="Subject"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Message</span>
              <span className="pointer-events-none absolute left-4 top-4 text-[#b08966]" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                  <path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#b08966" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full rounded-2xl border border-[#e7cfb7] bg-white px-4 py-3 pl-12 pt-6 outline-none transition focus:border-[#c8945d]"
                placeholder="Your Message"
              />
            </label>

            <div className="flex items-center gap-4 rounded-2xl border border-[#f0d6be] bg-white p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f7e7d8] to-[#f1d5b8] shadow-inner" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.5v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#c08951" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 8.5l-9 6-9-6" stroke="#c08951" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-[#8a5f31]">Your message will be sent to</p>
                <p className="text-sm">Miajboutique.ae@gmail.com</p>
                <p className="text-xs text-[#7a5733]">We typically reply within 24 hours.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#caa86f] to-[#d7b878] px-6 py-3 text-lg font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>

            {feedback ? (
              <p
                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                  status === 'success'
                    ? 'border-[#d9b28d] bg-[#f8efe7] text-[#7a5733]'
                    : 'border-[#e4b7b7] bg-[#fff5f5] text-[#9b4d4d]'
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          style={{ animation: 'modalFadeIn 0.22s ease-out forwards' }}
        >
          <div 
            className="w-full max-w-[340px] rounded-[28px] border border-[#e8caa9] bg-white/95 backdrop-blur-md p-6 text-center shadow-[0_24px_60px_rgba(77,52,36,0.18)]"
            style={{ animation: 'modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#caa86f] to-[#d7b878] text-white shadow-[0_4px_12px_rgba(202,168,111,0.3)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[#8a5f31] font-serif tracking-wide">Message Sent!</h3>
            <p className="mt-3 text-xs leading-relaxed text-[#6f5843] px-1">
              Thank you for contacting **MIAJ Boutique**. Your message has been successfully received. We will respond shortly to your email address.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#caa86f] to-[#d7b878] py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] outline-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
