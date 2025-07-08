
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModulesShowcase from "@/components/ModulesShowcase";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div id="hero">
        <Hero />
      </div>
      <div id="modules">
        <ModulesShowcase />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
