import React from "react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/Hero.png"
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
