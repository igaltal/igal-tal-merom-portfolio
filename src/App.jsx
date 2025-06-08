import './App.css'
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <main>
          <div id="hero">
            <Hero />
          </div>
          <About />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  )
}

export default App 