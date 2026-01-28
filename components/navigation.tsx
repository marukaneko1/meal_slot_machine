'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  Dices,
  CalendarDays,
  BookOpen,
  Upload,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Spin', icon: Dices },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: BookOpen },
];

const adminLinks = [
  { href: '/admin/upload', label: 'Upload CSV', icon: Upload },
  { href: '/admin/profiles', label: 'Profiles', icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-slot-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slot-gold to-yellow-600 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <Dices className="w-5 h-5 text-slot-bg" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-slot-gold to-yellow-300 bg-clip-text text-transparent">
              Meal Slot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-slot-gold text-black'
                      : 'text-gray-400 hover:text-slot-gold hover:bg-slot-gold/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            <div className="w-px h-6 bg-slot-gold/30 mx-2" />

            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-slot-gold/20 text-slot-gold border border-slot-gold/50'
                      : 'text-gray-500 hover:text-slot-gold hover:bg-slot-gold/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slot-gold/10 text-gray-400 hover:text-slot-gold transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slot-gold/30">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'bg-slot-gold text-black'
                        : 'text-gray-400 hover:text-slot-gold hover:bg-slot-gold/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-slot-gold/30 my-2" />

              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </p>

              {adminLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'bg-slot-gold/20 text-slot-gold border border-slot-gold/50'
                        : 'text-gray-500 hover:text-slot-gold hover:bg-slot-gold/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
