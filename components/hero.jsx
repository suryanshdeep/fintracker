"use client";
// these will be rendered on the  client side thse are more of the dynamic pages

import { useEffect, useRef } from "react"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
    // for handling the dynamic motion of the image in hero
    //section through scroll of the page

    // to get the reference of the image we have used useRef
    const imageRef=useRef(); 

    useEffect(()=>{
        const imageElement =imageRef.current;

        const handleScroll=()=>{
            const scrollPosition =window.scrollY;
            const scrollThreshold=100;

            // if scrolled more than a threshold then added the class of scrolled to the image
            if(scrollPosition>scrollThreshold){
                imageElement.classList.add("scrolled");
            }
            else{
                imageElement.classList.remove("scrolled"); 
            }
        };

        window.addEventListener("scroll",handleScroll);
        return ()=> window.removeEventListener("scroll",handleScroll)
    },[]); 
  return (
    <section className="pt-30 pb-30 px-4">
    <div className="container mx-auto text-center">
      <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
        Manage Your Finances <br /> with Intelligence
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        An AI-powered financial management platform that helps you track,
        analyze, and optimize your spending with real-time insights.
      </p>
      <div className="flex justify-center space-x-4">
        <Link href={"/dashboard"}>
          <Button size="lg" className="px-8">
            Get Started
          </Button>
        </Link>
        <Link href="https://www.youtube.com/roadsidecoder">
          <Button size="lg" variant='outline' className="px-8">
            Watch Demo
          </Button>
        </Link>
      </div>
      <div className="hero-image-wrapper mt-5 md:mt-0">
        {/* this ref={} can be used to give the effects to the images or text 
        basically we can assign a function through which these effects occurs on the
        images and text */}
        <div ref={imageRef} className="hero-image">
          <Image
            src="/banner.jpeg"
            width={1280}
            height={720}
            alt="Dashboard Preview"
            className="rounded-lg shadow-2xl border mx-auto"
            priority
          />
        </div>
      </div>
    </div>
  </section>
  )
}

export default HeroSection
