import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { profile, getIcon, asset } from "@/content";

export default function About() {
  const { about } = profile;

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6">About Me</h2>
          <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mb-4 md:mb-6"></div>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            {about.summary}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Bio Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col items-center lg:items-start"
          >
            <div className="relative mb-6 md:mb-8">
              <div className="absolute -top-2 md:-top-4 -left-2 md:-left-4 w-16 md:w-24 h-16 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50" aria-hidden="true"></div>
              <img
                src={asset(profile.photo)}
                alt={`${profile.name} portrait`}
                width="192"
                height="192"
                loading="lazy"
                decoding="async"
                className="relative w-32 h-32 md:w-48 md:h-48 rounded-2xl object-cover shadow-2xl"
              />
            </div>

            <div className="space-y-4 md:space-y-6 text-slate-700 leading-relaxed text-center lg:text-left">
              {about.bio.map((paragraph, index) => (
                <p key={index} className={index === 0 ? "text-base md:text-lg" : "text-sm md:text-base"}>
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Skills and Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            {/* Highlights */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6 text-center lg:text-left">Key Highlights</h3>
              <div className="grid grid-cols-1 gap-4">
                {about.highlights.map((highlight, index) => {
                  const Icon = getIcon(highlight.icon);
                  return (
                    <motion.div
                      key={highlight.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="p-4 md:p-6 h-full hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                            <Icon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">{highlight.title}</h4>
                            <p className="text-xs md:text-sm text-slate-600">{highlight.description}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6 text-center lg:text-left">Technical Skills</h3>
              <div className="space-y-4 md:space-y-6">
                {about.skills.map((skillGroup) => (
                  <motion.div
                    key={skillGroup.category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <h4 className="font-semibold text-slate-800 mb-2 md:mb-3 text-sm md:text-base text-center lg:text-left">{skillGroup.category}</h4>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {skillGroup.items.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs md:text-sm text-slate-700 border-slate-300 hover:bg-slate-50"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
