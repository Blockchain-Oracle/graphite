"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomConnectButton } from "@/components/web3/custom-connect-button";
import { TextAnimate } from "@/components/magicui/text-animate";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { 
    label: "Dashboard", 
    href: "/dashboard" 
  },
  { 
    label: "Airdrops", 
    href: "/airdrops", 
    children: [
      { label: "Explore", href: "/airdrops/explore" },
      { label: "Create", href: "/airdrops/create" },
      { label: "Manage", href: "/airdrops/manage" }
    ]
  },
  { 
    label: "NFTs", 
    href: "/nfts", 
    children: [
      { label: "Gallery", href: "/nfts/gallery" },
      { label: "Mint", href: "/nfts/mint" },
      { label: "Customize", href: "/nfts/customize" },
      { label: "My Collection", href: "/nfts/gallery?filter=owned" }
    ]
  },
  { label: "Profile", href: "/profile" }
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDropdown = (label: string) => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(label);
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-black/80 backdrop-blur-md py-2 shadow-lg" : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative h-10 w-10 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
              <div className="absolute inset-1 rounded-full bg-black" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-80" />
            </motion.div>
            
            <TextAnimate
              text="Graphite"
              className="text-xl font-bold"
              el="h1"
              animationType="bounce"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center space-x-1">
              {navItems.map((item) => (
                <li key={item.label} className="relative">
                  {item.children ? (
                    <div
                      className="group"
                      onMouseEnter={() => setActiveDropdown(item.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button
                        className="flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                        onClick={() => toggleDropdown(item.label)}
                      >
                        {item.label}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </button>
                      
                      <div
                        className={cn(
                          "absolute left-0 top-full z-10 min-w-[200px] rounded-lg bg-black/90 p-2 backdrop-blur-lg transition-all duration-200",
                          activeDropdown === item.label ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                      >
                        <div className="absolute -top-1 left-6 h-2 w-2 rotate-45 bg-black/90" />
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block rounded-md px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block rounded-md px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect Wallet Button */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <CustomConnectButton />
            </div>
            
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        className="lg:hidden fixed inset-0 z-40 bg-black/90 backdrop-blur-lg"
        initial={{ opacity: 0, y: "-100%" }}
        animate={{ 
          opacity: isOpen ? 1 : 0,
          y: isOpen ? "0%" : "-100%"
        }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <div className="flex h-full flex-col overflow-y-auto pt-20 pb-6 px-4">
          <nav className="mt-8">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <div className="mb-2">
                      <button
                        className="flex w-full items-center justify-between rounded-md px-4 py-3 text-lg font-medium text-white hover:bg-white/10"
                        onClick={() => toggleDropdown(item.label)}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 transition-transform",
                            activeDropdown === item.label ? "rotate-180" : ""
                          )}
                        />
                      </button>
                      
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: activeDropdown === item.label ? "auto" : 0,
                          opacity: activeDropdown === item.label ? 1 : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-2 space-y-2 border-l-2 border-white/20 pl-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block rounded-md px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
                              onClick={() => setIsOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block rounded-md px-4 py-3 text-lg font-medium text-white hover:bg-white/10"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="mt-auto px-4">
            <CustomConnectButton />
          </div>
        </div>
      </motion.div>
    </header>
  );
} 