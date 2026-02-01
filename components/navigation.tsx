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
  ShoppingCart,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getShoppingListCount } from '@/lib/utils/shopping-list';

const navLinks = [
  { href: '/', label: 'Spin', icon: Dices },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
];

const adminLinks = [
  { href: '/admin/upload', label: 'Upload CSV', icon: Upload },
  { href: '/admin/profiles', label: 'Profiles', icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const [shoppingCount, setShoppingCount] = useState(0);

  // Load shopping list count and listen for updates
  useEffect(() => {
    const updateCount = () => {
      setShoppingCount(getShoppingListCount());
    };

    updateCount();
    window.addEventListener('shopping-list-updated', updateCount);
    return () => window.removeEventListener('shopping-list-updated', updateCount);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-slot-gold/30 safe-area-top">
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

          {/* Desktop Navigation - Hidden on mobile (we use bottom nav) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isShopping = link.href === '/shopping';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-slot-gold text-black'
                      : 'text-gray-400 hover:text-slot-gold hover:bg-slot-gold/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {isShopping && shoppingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {shoppingCount > 9 ? '9+' : shoppingCount}
                    </span>
                  )}
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

          {/* Mobile: Show current page title */}
          <div className="md:hidden flex items-center">
            {/* Optional: Show page-specific actions here */}
          </div>
        </div>
      </div>
    </nav>
  );
}
