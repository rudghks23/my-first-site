import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Projects } from "@/components/projects"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
     <main
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/bg-home.jpg')" }}
    >
      <Header />
      <Hero />
      <About />
      <Projects />
      <Contact />
      <Footer />
    </main>
  )
}
