'use client';

import Link from 'next/link';
import Image from 'next/image';

export const Footer = () => {
  return (
    <footer className="footer-bg border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Image 
              src="/logo-text.png" 
              alt="Abundant Global Club Logo"
              width={160}
              height={60}
              className="mb-4"
            />
            <p className="text-sm text-gray-300">A global network of success</p>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-[#B8973A]">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/membership" className="text-gray-300 hover:text-white transition-colors">Membership</Link></li>
              <li><Link href="/events" className="text-gray-300 hover:text-white transition-colors">Events</Link></li>
              <li><Link href="/opportunities" className="text-gray-300 hover:text-white transition-colors">Opportunities</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-[#B8973A]">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-[#B8973A]">Connect</h3>
            <p className="text-sm text-gray-400">Follow us on social media</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">© 2026 Abundant Global Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
