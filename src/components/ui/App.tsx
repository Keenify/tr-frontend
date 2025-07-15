import React from 'react'
const App = () => {
    const [selectedColor, setSelectedColor] = useState('Blue Shadow');
    const colors = [
        { name: 'Blue Shadow', color: 'bg-blue-900' },
        { name: 'Gray', color: 'bg-gray-400' },
        { name: 'Cream', color: 'bg-yellow-100' },
        { name: 'Phantom Black', color: 'bg-black' },
    ];

    return (
        <div className="bg-black text-white font-sans antialiased">
            {/* GEN_SECTION_START: Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold tracking-wider">SAMSUNG</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 hover:bg-gray-800 rounded-full"><SearchIcon /></button>
                            <button className="p-2 hover:bg-gray-800 rounded-full"><CartIcon /></button>
                            <button className="p-2 hover:bg-gray-800 rounded-full"><UserIcon /></button>
                            <button className="p-2 hover:bg-gray-800 rounded-full"><MenuIcon /></button>
                        </div>
                    </div>
                </div>
            </header>
            {/* GEN_SECTION_END: Header */}

            {/* GEN_SECTION_START: Hero */}
            <section className="h-screen flex items-center justify-center bg-black">
                <h2 className="text-8xl font-bold tracking-tighter">Ultra Unfolds</h2>
            </section>
            {/* GEN_SECTION_END: Hero */}

            {/* GEN_SECTION_START: StickyNav */}
            <nav className="sticky top-16 z-40 bg-white text-black py-3 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center space-x-8">
                        <h3 className="text-xl font-bold">Galaxy Z Fold5</h3>
                        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
                            <a href="#" className="hover:text-black">Features</a>
                            <a href="#" className="hover:text-black">Compare</a>
                            <a href="#" className="hover:text-black">Switch to Galaxy</a>
                        </div>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">
                        Buy now
                    </button>
                </div>
            </nav>
            {/* GEN_SECTION_END: StickyNav */}

            {/* GEN_MODULE_START: AllNewFold */}
            <main className="bg-white text-black">
                {/* Product Intro Section */}
                <section className="py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Our all-new Fold</h2>
                        <h3 className="text-5xl md:text-7xl font-bold mb-6">Meet the new <br /> Galaxy Z Fold.</h3>
                        <div className="relative inline-block">
                            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm flex items-center">
                                <LiveShopIcon />
                                SAMSUNG LIVE SHOP
                            </div>
                            <img src="https://images.samsung.com/is/image/samsung/assets/my/smartphones/galaxy-z-fold5/buy/Z-Fold5_Marketing-KV_1440x810.jpg?$1440_810_JPG$" alt="Galaxy Z Fold5 unfolded with S Pen" className="rounded-lg mx-auto" />
                            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg text-left max-w-xs">
                                <p className="text-lg font-bold">Unfold with S Pen.</p>
                                <p className="text-xs">And get 1-year FREE Samsung Care+ worth RM899.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Sections */}
                <div className="space-y-4">
                    {/* Feature 1: Main Display */}
                    <div className="relative text-white h-[60vh] md:h-[80vh] flex items-center justify-center">
                         <img src="https://images.samsung.com/is/image/samsung/assets/my/smartphones/galaxy-z-fold5/images/galaxy-z-fold5-highlights-display-kv.jpg?$ORIGIN_JPG$" alt="Man watching video on Galaxy Z Fold5" className="absolute inset-0 w-full h-full object-cover -z-10" />
                        <div className="text-center bg-black bg-opacity-30 p-8 rounded-lg">
                            <p className="text-sm font-bold">IMMERSIVE VIEWING</p>
                            <h3 className="text-3xl md:text-5xl font-bold my-4">The ultimate 7.6-inch <br /> Main Display</h3>
                            <button className="mt-4 border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-black transition-colors">
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* Feature 2: Processor */}
                    <div className="relative text-white h-[60vh] md:h-[80vh] flex items-center justify-center">
                        <img src="https://images.samsung.com/is/image/samsung/assets/my/smartphones/galaxy-z-fold5/images/galaxy-z-fold5-highlights-gaming-kv.jpg?$ORIGIN_JPG$" alt="Gaming on Galaxy Z Fold5" className="absolute inset-0 w-full h-full object-cover -z-10"/>
                        <div className="text-center bg-black bg-opacity-30 p-8 rounded-lg">
                            <p className="text-sm font-bold">POWERFUL GAMING</p>
                            <h3 className="text-3xl md:text-5xl font-bold my-4">The most powerful processor <br /> on a Galaxy Z Fold yet</h3>
                            <button className="mt-4 border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-black transition-colors">
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* Feature 3: Battery */}
                    <div className="relative text-white h-[60vh] md:h-[80vh] flex items-center justify-center">
                        <img src="https://images.samsung.com/is/image/samsung/assets/my/smartphones/galaxy-z-fold5/images/galaxy-z-fold5-highlights-battery-kv.jpg?$ORIGIN_JPG$" alt="Galaxy Z Fold5 battery life visualization" className="absolute inset-0 w-full h-full object-cover -z-10"/>
                        <div className="text-center bg-black bg-opacity-30 p-8 rounded-lg">
                            <p className="text-sm font-bold">LONG-LASTING BATTERY</p>
                            <h3 className="text-3xl md:text-5xl font-bold my-4">Efficient battery powers all- <br />day play</h3>
                             <p className="text-sm mt-2">Up to 21 hours of video playback</p>
                            <button className="mt-4 border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-black transition-colors">
                                Learn more
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ultra Sleek Section */}
                <section className="h-[80vh] flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-white text-center text-black">
                    <h2 className="text-6xl md:text-8xl font-bold mb-8">Ultra sleek. <br />Ultra light.</h2>
                    <p className="max-w-2xl text-lg text-gray-700">
                        Whether folded or unfolded, the Galaxy Z Fold5 exceeds all expectations of a smartphone. With a massive Cover Screen and Main Screen, this is the ultimate device for doing it all. Unfold a cinematic experience in the palm of your hand, and close it to enjoy the one-hand comfort of a conventional smartphone.
                    </p>
                </section>

                {/* Color Selection Section */}
                <section className="py-20 bg-white text-center text-black">
                    <h2 className="text-5xl font-bold mb-12">Sleek tech in sleek <br/> colors</h2>
                    <div className="flex justify-center mb-4">
                        <img src="https://images.samsung.com/is/image/samsung/p6pim/my/2307/gallery/my-galaxy-z-fold5-f946-sm-f946blbdxme-537330325?$650_519_PNG$" alt="Blue Shadow Galaxy Z Fold5" className="h-96" />
                    </div>
                    <p className="mb-4 font-semibold">{selectedColor}</p>
                    <div className="flex justify-center space-x-3 mb-8">
                        {colors.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => setSelectedColor(c.name)}
                                className={`w-8 h-8 rounded-full ${c.color} border-2 ${selectedColor === c.name ? 'border-blue-600' : 'border-gray-300'} focus:outline-none ring-offset-2 ring-blue-500 ${selectedColor === c.name ? 'ring-2' : ''}`}
                                aria-label={`Select ${c.name} color`}
                            ></button>
                        ))}
                    </div>
                    <button className="bg-black text-white px-10 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors">
                        Pre-order
                    </button>
                </section>

                {/* Accessories Section */}
                <section className="py-20 bg-gray-100 text-center text-black">
                    <h2 className="text-4xl font-bold mb-10">Accessories to keep your <br/> Fold protected</h2>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg p-8">
                            <img src="https://images.samsung.com/is/image/samsung/p6pim/my/ef-xf946ctegww/gallery/my-galaxy-z-fold5-slim-s-pen-case-ef-xf946ctegww-537233215?$650_519_PNG$" alt="Carbon Shield Case" className="h-64 mx-auto mb-4"/>
                            <h3 className="text-2xl font-bold mb-2">Carbon Shield</h3>
                            <button className="text-blue-600 font-bold hover:underline">Learn more</button>
                        </div>
                        <div className="bg-white rounded-lg p-8">
                            <img src="https://images.samsung.com/is/image/samsung/p6pim/my/ef-of94pcuegww/gallery/my-galaxy-z-fold5-standing-case-with-strap-ef-of94pcuegww-537233075?$650_519_PNG$" alt="Silicone Case" className="h-64 mx-auto mb-4"/>
                            <h3 className="text-2xl font-bold mb-2">Silicone Case</h3>
                            <button className="text-blue-600 font-bold hover:underline">Learn more</button>
                        </div>
                    </div>
                </section>

                {/* Final Section */}
                <section className="py-20 bg-white text-center text-black">
                     <h2 className="text-5xl font-bold">Tough sleek. Built tough.</h2>
                </section>
            </main>
            {/* GEN_MODULE_END: AllNewFold */}
        </div>
    );
};

export default App;
