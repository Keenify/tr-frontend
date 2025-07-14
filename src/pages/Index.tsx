
import Header from "@/components/Header";
import CombinedHeroModules from "@/components/CombinedHeroModules";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div id="hero">
        <CombinedHeroModules />
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
