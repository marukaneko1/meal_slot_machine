'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  Sparkles,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Upload,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getShoppingListCount } from '@/lib/utils/shopping-list';
import { useSparkle } from './sparkle-provider';

const navLinks = [
  { href: '/', label: 'Spin', icon: Sparkles },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
];

const adminLinks = [
  { href: '/admin/upload', label: 'Upload', icon: Upload },
  { href: '/admin/profiles', label: 'Profiles', icon: Users, isProfileLink: true },
];

export function Navigation() {
  const pathname = usePathname();
  const [shoppingCount, setShoppingCount] = useState(0);
  const { handleProfileClick, isSparkleMode } = useSparkle();

  useEffect(() => {
    const updateCount = () => {
      setShoppingCount(getShoppingListCount());
    };

    updateCount();
    window.addEventListener('shopping-list-updated', updateCount);
    return () => window.removeEventListener('shopping-list-updated', updateCount);
  }, []);

  return (
    <nav 
      className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-b border-border-subtle"
      aria-label="Main navigation"
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105",
              isSparkleMode ? "bg-pink-500" : "bg-accent"
            )}>
              <Sparkles className="w-4 h-4 text-bg" aria-hidden="true" />
            </div>
            <span className="font-display font-semibold text-lg text-text">
              {isSparkleMode ? '✨ Meal Slot ✨' : 'Meal Slot'}
            </span>
          </Link>

          {/* Main Navigation */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isShopping = link.href === '/shopping';
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'nav-link relative',
                    isActive && 'nav-link-active'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{link.label}</span>
                  {isShopping && shoppingCount > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-bg text-[10px] font-bold flex items-center justify-center px-1",
                        isSparkleMode ? "bg-pink-500" : "bg-accent"
                      )}
                      aria-label={`${shoppingCount} items in shopping list`}
                    >
                      {shoppingCount > 9 ? '9+' : shoppingCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="w-px h-5 bg-border-subtle mx-2" aria-hidden="true" />

            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href);
              const isProfileLink = 'isProfileLink' in link && link.isProfileLink;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={isProfileLink ? handleProfileClick : undefined}
                  className={cn(
                    'nav-link',
                    isActive && 'nav-link-active',
                    isProfileLink && isSparkleMode && 'text-pink-400'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
