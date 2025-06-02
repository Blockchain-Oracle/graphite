"use client";

import { motion } from "motion/react";
import Link from "next/link";

export function Footer() {
  const navigation = {
    main: [
      { name: "Home", href: "#" },
      { name: "Features", href: "#features" },
      { name: "Documentation", href: "#" },
      { name: "About", href: "#" },
    ],
    social: [
      {
        name: "Twitter",
        href: "https://twitter.com/graphiteecosystem",
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        ),
      },
      {
        name: "GitHub",
        href: "https://github.com/graphiteecosystem",
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
      {
        name: "Discord",
        href: "https://discord.gg/graphite",
        icon: (props: any) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path
              fillRule="evenodd"
              d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.89-.608 1.283a18.566 18.566 0 0 0-5.487 0A12.785 12.785 0 0 0 8.65 3.038a.077.077 0 0 0-.079-.036 20.03 20.03 0 0 0-4.885 1.49.069.069 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.099 20.099 0 0 0 6.031 3.028.072.072 0 0 0 .079-.025c.427-.58.81-1.19 1.138-1.834a.075.075 0 0 0-.041-.105 13.209 13.209 0 0 1-1.894-.9.075.075 0 0 1-.008-.125c.127-.095.254-.193.375-.292a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.1.25.198.376.292a.075.075 0 0 1-.006.127c-.604.35-1.234.645-1.897.898a.075.075 0 0 0-.41.106c.336.644.718 1.255 1.137 1.833a.075.075 0 0 0 .078.026 20.05 20.05 0 0 0 6.032-3.028.075.075 0 0 0 .031-.055c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"
              clipRule="evenodd"
            />
          </svg>
        ),
      },
    ],
  };

  return (
    <motion.footer
      className="relative overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/50 to-black"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          {navigation.social.map((item) => (
            <motion.a
              whileHover={{ scale: 1.1 }}
              key={item.name}
              href={item.href}
              className="text-gray-400 hover:text-gray-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </motion.a>
          ))}
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            {navigation.main.map((item) => (
              <div key={item.name} className="px-5 py-2">
                <Link href={item.href} className="text-base text-gray-400 hover:text-gray-300">
                  {item.name}
                </Link>
              </div>
            ))}
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Graphite Ecosystem. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
} 