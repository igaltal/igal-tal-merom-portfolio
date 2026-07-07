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
// This is a single-page site with no client router; /booking is the one
// other route, so a plain pathname check is simpler than pulling in one.
const Booking = lazy(() => import("./pages/Booking"));

const description =
  "Igal Tal Merom — Software Engineer specializing in AI-powered products and UI/UX engineering. Building intelligent, human-centered software with React, Python, and LLM APIs.";

function App() {
  const isBooking = window.location.pathname.replace(/\/$/, '') === '/booking';

  if (isBooking) {
    return (
      <>
        <div className="min-h-screen">
          <Navigation />
          <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
            <Booking />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Igal Tal Merom — AI & UI/UX Software Engineer"
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
