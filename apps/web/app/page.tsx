import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import Hero from '@/components/landing/hero'
import HowItWorks from '@/components/landing/how-it-works'
import Benefits from '@/components/landing/benefits'

export default function Page() {
  return (
    <div data-scale-zone="landing">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
      </main>
      <Footer />
    </div>
  )
}
