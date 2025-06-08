import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Code, Rocket, Users, Zap } from "lucide-react";

export default function About() {
  const skills = [
    { category: "Languages", items: ["Python", "Java", "C#", "JavaScript"] },
    { category: "Frontend", items: ["React", "HTML/CSS", "Tailwind CSS", "Vue.js"] },
    { category: "Backend", items: ["Flask", "Django", "Node.js", "SQLite"] },
    { category: "Tools", items: ["Git", "Docker", "Selenium", "Firebase"] }
  ];

  const highlights = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Software Developer",
      description: "Junior Software Developer at Voltify working with real-time systems"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Academic Coordinator",
      description: "Managing Computer Science track activities at Reichman University"
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Entrepreneur",
      description: "Developing innovative AI-powered applications and solutions"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Military Background",
      description: "Former combat soldier and instructor in Israeli Air Force"
    }
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">About Me</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Passionate about creating innovative solutions that bridge technology and real-world impact
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Bio Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col items-center lg:items-start"
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50"></div>
              <img 
                src="/assets/images/igal-photo.jpg" 
                alt="Igal Tal Merom"
                className="relative w-48 h-48 rounded-2xl object-cover shadow-2xl mb-8"
              />
            </div>
            
            <div className="space-y-6 text-slate-700 leading-relaxed">
              <p className="text-lg">
                I'm a 25-year-old software developer and Computer Science & Entrepreneurship student at Reichman University, passionate about building innovative solutions that make a real impact.
              </p>
              <p>
                Currently working as a <span className="font-semibold text-blue-600">Junior Software Developer at Voltify</span>, where I contribute to real-time infrastructure and industrial systems, gaining valuable experience in scalable system architecture.
              </p>
              <p>
                I also serve as the <span className="font-semibold">Academic Coordinator for the Computer Science track</span> at my university, where I strengthen connections between students and faculty while organizing events and supporting student success.
              </p>
              <p>
                My journey includes military service as a combat soldier and instructor in the Israeli Air Force, and professional experience at the Israeli Consulate and UN Mission in New York, where I handled logistics and event management for diplomatic operations.
              </p>
            </div>
          </motion.div>

          {/* Skills and Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Highlights */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          {highlight.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{highlight.title}</h4>
                          <p className="text-sm text-slate-600">{highlight.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Technical Skills</h3>
              <div className="space-y-6">
                {skills.map((skillGroup, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h4 className="font-semibold text-slate-800 mb-3">{skillGroup.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill, skillIndex) => (
                        <Badge 
                          key={skillIndex}
                          variant="outline" 
                          className="text-slate-700 border-slate-300 hover:bg-slate-50"
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