import Navbar from '@/sections/Navbar'
import Hero from '@/sections/Hero'
import DataSources from '@/sections/DataSources'
import Pricing from '@/sections/Pricing'
import Ecosystem from '@/sections/Ecosystem'
import CTA from '@/sections/CTA'
import Footer from '@/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1923]">
      <Navbar />
      <Hero />
      <DataSources />
      <Pricing />
      <Ecosystem />
      <CTA />
      <Footer />
    </div>
  )
}
