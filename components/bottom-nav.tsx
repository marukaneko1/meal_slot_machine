'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Sparkles, CalendarDays, BookOpen, ShoppingCart, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getShoppingListCount } from '@/lib/utils/shopping-list';
import { useSparkle } from './sparkle-provider';
import { haptic } from '@/lib/utils/haptic';

const navItems = [
  { href: '/', label: 'Spin', icon: Sparkles },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/shopping', label: 'Shop', icon: ShoppingCart },
  { href: '/admin/profiles', label: 'Admin', icon: Settings, isProfileLink: true },
];

export function BottomNav() {
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

  const handleTap = (isProfileLink?: boolean) => {
    haptic.tap();
    if (isProfileLink) {
      handleProfileClick();
    }
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      aria-label="Main navigation"
    >
      <div className="absolute inset-0 bg-bg/95 backdrop-blur-md border-t border-border-subtle" />
      
      <div className="relative px-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const isShopping = item.href === '/shopping';
            const isProfileLink = 'isProfileLink' in item && item.isProfileLink;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleTap(isProfileLink)}
                className={cn(
                  'relative flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors',
                  isActive 
                    ? isSparkleMode ? 'text-pink-400' : 'text-accent' 
                    : 'text-text-muted'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      'w-5 h-5', 
                      isActive && (isSparkleMode ? 'text-pink-400' : 'text-accent')
                    )} 
                    aria-hidden="true" 
                  />
                  {isShopping && shoppingCount > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full text-bg text-[9px] font-bold flex items-center justify-center px-1",
                        isSparkleMode ? "bg-pink-500" : "bg-accent"
                      )}
                      aria-label={`${shoppingCount} items in shopping list`}
                    >
                      {shoppingCount > 99 ? '99+' : shoppingCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium mt-1',
                  isActive 
                    ? isSparkleMode ? 'text-pink-400' : 'text-accent' 
                    : 'text-text-muted'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
