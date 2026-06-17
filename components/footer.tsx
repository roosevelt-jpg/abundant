'use client';

import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-heading text-lg font-bold text-accent">ABUNDANT</span>
            </div>
            <p className="text-sm text-muted-foreground">A global network of success</p>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-accent">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/membership" className="text-muted-foreground hover:text-foreground transition-colors">Membership</Link></li>
              <li><Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link></li>
              <li><Link href="/opportunities" className="text-muted-foreground hover:text-foreground transition-colors">Opportunities</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-accent">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4 text-accent">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2026 Abundant Global Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
