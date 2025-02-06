import React from 'react';
import { Session } from '@supabase/supabase-js';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import '../styles/Home.css';

interface HomeProps {
  session: Session;
}

const imagePaths = [
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-0.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-1.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-2.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-3.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-4.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-5.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-6.png",
  "src/assets/svn KL-officewall design FA_visual-guide_outlined/9d445079-a305-433e-81b7-bac1fc557797-7.png"
];

const Home: React.FC<HomeProps> = ({ session }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    dotsClass: "slick-dots custom-dots",
    appendDots: (dots: React.ReactNode) => (
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        width: '100%'
      }}>
        {dots}
      </div>
    ),
    customPaging: () => (
      <div style={{
        width: '12px',
        height: '12px',
        border: '2px solid #666',
        borderRadius: '50%',
        margin: '0 5px',
        backgroundColor: 'transparent',
        transition: 'all 0.3s ease',
      }}></div>
    ),
  };

  console.log(session);

  return (
    <div style={{ 
      padding: '20px', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ 
        border: '2px solid #ccc', 
        padding: '10px', 
        position: 'relative', 
        height: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '50px'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          <Slider {...settings}>
            {imagePaths.map((path, index) => (
              <div key={index} style={{ 
                width: '100%',
                height: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={path} 
                  alt={`Slide ${index}`} 
                  style={{ 
                    maxWidth: '70%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    border: '2px solid #000',
                    padding: '5px',
                    margin: '0 auto'
                  }} 
                />
              </div>
            ))}
          </Slider>
        </div>
      </div>
      {/* Add more personalized content or components here */}
    </div>
  );
};

export default Home;