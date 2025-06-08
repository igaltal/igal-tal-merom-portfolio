import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-slate-200' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="font-bold text-xl cursor-pointer"
              onClick={() => scrollToSection('#hero')}
            >
              <span className={`${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                Igal Tal Merom
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ y: -2 }}
                  onClick={() => scrollToSection(item.href)}
                  className={`font-medium transition-colors duration-200 ${
                    isScrolled 
                      ? 'text-slate-700 hover:text-blue-600' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
              <Button 
                onClick={() => scrollToSection('#contact')}
                className={`${
                  isScrolled 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                } border-0`}
              >
                Get in Touch
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${isScrolled ? 'text-slate-900' : 'text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 md:hidden"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="flex flex-col space-y-4">
                {navItems.map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left text-slate-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                  >
                    {item.label}
                  </motion.button>
                ))}
                <Button 
                  onClick={() => scrollToSection('#contact')}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                >
                  Get in Touch
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}