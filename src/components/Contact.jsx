import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Github, Linkedin, Download, Palette } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { profile, asset } from "@/content";

// Shared client/server contract. Keep in sync with api/contact.js.
const contactSchema = z.object({
  from_name: z.string().trim().min(2, "Please enter your name").max(100),
  from_email: z.string().trim().email("Please enter a valid email").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export default function Contact() {
  const [formData, setFormData] = useState({ from_name: "", from_email: "", message: "" });
  const [company, setCompany] = useState(""); // honeypot — must stay empty
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      toast({
        title: "Please check the form",
        description: parsed.error.issues[0]?.message || "Some fields are invalid.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, company }),
      });

      if (res.ok) {
        toast({
          title: "Message sent successfully!",
          description: "Thank you for reaching out. I'll get back to you soon.",
        });
        setFormData({ from_name: "", from_email: "", message: "" });
      } else if (res.status === 429) {
        toast({
          title: "Too many requests",
          description: "Please wait a moment before sending another message.",
          variant: "destructive",
        });
      } else {
        throw new Error("Request failed");
      }
    } catch {
      toast({
        title: "Error sending message",
        description: `Please try again or email me directly at ${profile.email}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    { icon: <Mail className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { icon: <Phone className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />, label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/[^+\d]/g, "")}` },
    { icon: <MapPin className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />, label: "Location", value: profile.location, href: null },
  ];

  const socialLinks = [
    { icon: <Linkedin className="w-5 h-5" aria-hidden="true" />, label: "LinkedIn", href: profile.social.linkedin },
    { icon: <Github className="w-5 h-5" aria-hidden="true" />, label: "GitHub", href: profile.social.github },
    { icon: <Palette className="w-5 h-5" aria-hidden="true" />, label: "UI/UX Portfolio", href: profile.social.uiuxPortfolio },
  ];

  return (
    <section id="contact" className="py-16 md:py-24 bg-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Get In Touch</h2>
          <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mb-4 md:mb-6"></div>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto px-4">
            Ready to discuss your next project or just want to say hello? I'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-white">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" noValidate>
                  {/* Honeypot: hidden from users, bots tend to fill it */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="company">Company (leave blank)</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_name" className="text-slate-300">Name</Label>
                    <Input
                      id="from_name"
                      name="from_name"
                      value={formData.from_name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_email" className="text-slate-300">Email</Label>
                    <Input
                      id="from_email"
                      name="from_email"
                      type="email"
                      value={formData.from_email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-300">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                      placeholder="Tell me about your project or just say hello..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & Resume */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            {/* Contact Information */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 md:gap-4"
                  >
                    <div className="p-2 md:p-3 bg-blue-600 rounded-lg text-white flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-slate-400 font-medium">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm md:text-base text-white hover:text-blue-400 transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm md:text-base text-white">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                <div className="flex gap-3 pt-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="p-3 bg-slate-700/50 rounded-lg text-white hover:bg-blue-600 transition-colors"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resume Download */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <CardContent className="p-6 md:p-8 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Download My Resume</h3>
                <p className="text-blue-100 mb-4 md:mb-6 text-sm md:text-base">
                  Get a detailed overview of my experience, skills, and projects
                </p>
                <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                  <a href={asset(profile.resumeFile)} download>
                    <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                    Download Resume
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
