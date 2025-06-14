import HeroSection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { featuresData, howItWorksData, statsData, testimonialsData } from "@/data/landing";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-40 text-center">
      <HeroSection/>
      {/* stats section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((statsData,index)=>(
              <div key={index}>
                <div className="text-4xl font-bold text-blue-600 mb-2"
                >{statsData.value}</div>
                <div className="text-gray-600">{statsData.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* feature section */}
      <section className="py-20">
        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-3xl pt-10 font-bold text-center mb-12">
            Everything you need to manage your Finances </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature,index)=>(
              <Card key={index}>
              <CardContent className="space-y-4 pt-4">
                {feature.icon}
                <h1 className="text-xl font-semibold">{feature.title}</h1>
              <p className="text-gray-600">{feature.description}</p>
              </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>
      {/* how it works section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-3xl pt-10 font-bold text-center mb-16">
            How it Works </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map((step,index)=>(
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600 ">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* {testimonials} */}
      <section className="py-20">
        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-3xl pt-10 font-bold text-center mb-12">
            What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial,index)=>(
              <Card key={index} className="p-6">
              <CardContent className="pt-4">
                <div className="flex items-center mb-4">
            {/* {Without this config, Next.js blocks the image to protect your app.
            Adding the domain in next.config.mjs allows the <Image /> component to:
            Load it properly
            Optimize it (resize, lazy-load, cache, etc.)} 
            as here we have used the images from external source
            thus we have to define it in next.config.mjs*/}
                  <Image src={testimonial.image}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full"/>
                    <div className="ml-4">
                      <div className="font-semibold"> {testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                </div>
                <p className="text-gray-600">{testimonial.quote}</p>
              </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>
      {/* start now section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
           Read to Take Controls of Your Finances?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their finances smarter with FinTrack
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 animate-pulse">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
