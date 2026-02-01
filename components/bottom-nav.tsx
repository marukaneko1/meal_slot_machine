'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Dices, CalendarDays, BookOpen, ShoppingCart, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getShoppingListCount } from '@/lib/utils/shopping-list';

const navItems = [
  { href: '/', label: 'Spin', icon: Dices },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/shopping', label: 'Shop', icon: ShoppingCart },
  { href: '/admin/upload', label: 'Admin', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [shoppingCount, setShoppingCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setShoppingCount(getShoppingListCount());
    };

    updateCount();
    window.addEventListener('shopping-list-updated', updateCount);
    return () => window.removeEventListener('shopping-list-updated', updateCount);
  }, []);

  // Haptic feedback for mobile
  const handleTap = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Background with blur and border */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl border-t border-slot-gold/30" />
      
      {/* Content with minimal safe area padding - just enough for notched devices */}
      <div className="relative px-4 pb-[max(env(safe-area-inset-bottom,0px),4px)] pt-2">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const isShopping = item.href === '/shopping';

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleTap}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-all duration-200 active:scale-95',
                  isActive
                    ? 'text-slot-gold'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-6 h-6 transition-transform', isActive && 'scale-110')} />
                  {isShopping && shoppingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {shoppingCount > 99 ? '99+' : shoppingCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium mt-1 transition-all',
                  isActive ? 'text-slot-gold' : 'text-gray-500'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slot-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
