import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ExternalLink, Github, TrendingUp, Dumbbell, GraduationCap, ShoppingCart } from "lucide-react";

export default function Projects() {
  const projects = [
    {
      title: "AI Stock Analyst",
      description: "An intelligent financial analysis tool that leverages artificial intelligence to provide data-driven investment recommendations based on real-time market news.",
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
      tags: ["Python", "AI/ML", "Financial Analysis", "Real-time Data"],
      role: "Full-Stack Developer",
      status: "Active Development",
      gradient: "from-green-500 to-emerald-600",
      github: "ai-stock-analyst"
    },
    {
      title: "My Personal Gym",
      description: "A comprehensive web application designed to manage and enhance the experience of gym goers and trainers. Includes user management, trainer schedules, and progress tracking.",
      icon: <Dumbbell className="w-6 h-6 md:w-8 md:h-8" />,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
      tags: ["C#", "SQLite", "Web Development", "Database Management"],
      role: "Lead Developer",
      status: "Completed",
      gradient: "from-blue-500 to-cyan-600",
      github: "My_Personal_Gym"
    },
    {
      title: "University Grades Project",
      description: "Automated system for retrieving and notifying university grades using Selenium for web scraping, SQLite for database management, and Telegram bot for notifications.",
      icon: <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />,
      image: "https://images.unsplash.com/photo-1606276634203-2fe764737769?w=600&h=400&fit=crop",
      tags: ["Python", "Selenium", "SQLite", "Telegram Bot"],
      role: "Solo Developer",
      status: "Live",
      gradient: "from-purple-500 to-indigo-600",
      github: "UniversityGradesProject"
    },
    {
      title: "AliPrice Optimizer",
      description: "A tool that optimizes the shopping experience by focusing on price efficiency, helping users find the best deals across different platforms.",
      icon: <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      tags: ["Python", "Web Scraping", "Price Comparison", "Automation"],
      role: "Creator",
      status: "In Progress",
      gradient: "from-orange-500 to-red-600",
      github: "AliPriceOptimizer"
    }
  ];

  return (
    <section id="projects" className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6">Featured Projects</h2>
          <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mb-4 md:mb-6"></div>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            A showcase of my recent work in software development, from AI-powered applications to automation tools
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 border-slate-200">
                {/* Project Image */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${project.gradient} opacity-20`}></div>
                  
                  {/* Project Icon */}
                  <div className="absolute top-3 md:top-4 left-3 md:left-4">
                    <div className={`p-2 md:p-3 bg-white/90 backdrop-blur-sm rounded-xl text-slate-700 shadow-lg`}>
                      {project.icon}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 md:top-4 right-3 md:right-4">
                    <Badge 
                      className={`bg-white/90 backdrop-blur-sm text-slate-700 border-0 shadow-lg text-xs`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">{project.title}</h3>
                      <p className="text-xs md:text-sm text-slate-500 font-medium">{project.role}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 md:space-y-6 pt-0">
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-slate-800 mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex}
                          variant="outline" 
                          className="text-xs border-slate-300 text-slate-600"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:flex-1 border-slate-300 hover:bg-slate-50"
                      onClick={() => window.open(`https://github.com/igaltal/${project.github}`, '_blank')}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      View Code
                    </Button>
                    <Button 
                      size="sm"
                      className={`w-full sm:flex-1 bg-gradient-to-r ${project.gradient} hover:opacity-90 border-0`}
                      onClick={() => window.open(`https://github.com/igaltal/${project.github}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* GitHub CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <Card className="max-w-2xl mx-auto p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Explore More Projects</h3>
            <p className="text-sm md:text-base text-slate-300 mb-4 md:mb-6">
              Check out my GitHub for additional projects, machine learning experiments, and open source contributions
            </p>
            <Button 
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => window.open('https://github.com/igaltal', '_blank')}
            >
              <Github className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              View GitHub Profile
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}