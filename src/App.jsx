import React, { Suspense, lazy } from 'react'
import './App.css'
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Seo from "./components/Seo";

// Code-split below-the-fold sections so the hero paints fast.
const About = lazy(() => import("./components/About"));
const Projects = lazy(() => import("./components/Projects"));
const Contact = lazy(() => import("./components/Contact"));
const Footer = lazy(() => import("./components/Footer"));
const Toaster = lazy(() => import("./components/ui/toaster").then((m) => ({ default: m.Toaster })));

const description =
  "Igal Tal Merom — Software Engineer building distributed systems and real-time infrastructure with Python & C++. CS & Entrepreneurship graduate, builder, and founder.";

function App() {
  return (
    <>
      <Seo
        title="Igal Tal Merom — Software Engineer & Builder"
        description={description}
        path="/"
        type="profile"
      />
      <div className="min-h-screen">
        <Navigation />
        <main>
          <div id="hero">
            <Hero />
          </div>
          <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
            <About />
            <Projects />
            <Contact />
            <Footer />
          </Suspense>
        </main>
      </div>
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </>
  )
}

export default App
