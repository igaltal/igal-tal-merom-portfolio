import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Github, Linkedin, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import emailjs from '@emailjs/browser';

export default function Contact() {
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID', 
        formData,
        'YOUR_PUBLIC_KEY'
      );

      if (result.status === 200) {
        toast({
          title: "Message sent successfully!",
          description: "Thank you for reaching out. I'll get back to you soon.",
        });
        setFormData({ from_name: '', from_email: '', message: '' });
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again or contact me directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5 md:w-6 md:h-6" />,
      label: "Email",
      value: "talm13124@gmail.com",
      href: "mailto:talm13124@gmail.com"
    },
    {
      icon: <Phone className="w-5 h-5 md:w-6 md:h-6" />,
      label: "Phone",
      value: "+972-522-491312",
      href: "tel:+972522491312"
    },
    {
      icon: <MapPin className="w-5 h-5 md:w-6 md:h-6" />,
      label: "Location",
      value: "Israel",
      href: null
    }
  ];

  const socialLinks = [
    {
      icon: <Linkedin className="w-5 h-5" />,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/igal-tal-merom-a6874a180/"
    },
    {
      icon: <Github className="w-5 h-5" />,
      label: "GitHub",
      href: "https://github.com/igaltal"
    }
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
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="from_name" className="text-slate-300">Name</Label>
                    <Input
                      id="from_name"
                      name="from_name"
                      value={formData.from_name}
                      onChange={handleChange}
                      required
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
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
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
                    key={index}
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
                        <a 
                          href={item.href}
                          className="text-sm md:text-base text-white hover:text-blue-400 transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm md:text-base text-white">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Resume Download */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              <CardContent className="p-6 md:p-8 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Download My Resume</h3>
                <p className="text-blue-100 mb-4 md:mb-6 text-sm md:text-base">
                  Get a detailed overview of my experience, skills, and projects
                </p>
                <Button 
                  className="bg-white text-blue-600 hover:bg-blue-50 border-0"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/igal-tal-merom-portfolio/assets/documents/Igal_Tal_Merom_Resume.pdf';
                    link.download = 'Igal_Tal_Merom_Resume.pdf';
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}