import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import About from '@/components/landing/about'

export default function AboutPage() {
  return (
    <div data-scale-zone="landing">
      <Navbar />
      <main>
        <About />
      </main>
      <Footer />
    </div>
  )
}
