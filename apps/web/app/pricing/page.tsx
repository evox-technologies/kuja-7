import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import Pricing from '@/components/landing/pricing'

export default function PricingPage() {
  return (
    <div data-scale-zone="landing">
      <Navbar />
      <main>
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
