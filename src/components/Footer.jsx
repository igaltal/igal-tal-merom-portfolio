import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { profile } from "@/content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-500" aria-hidden="true" />
            <span>by {profile.name}</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {year} {profile.name}. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
