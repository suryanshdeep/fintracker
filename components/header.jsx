import React from 'react'
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
  } from '@clerk/nextjs'
import  Link  from 'next/link'
import Image from 'next/image'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox } from 'lucide-react'
import { checkUser } from '@/lib/checkUser'


const Header = async() => {
  //Calling CHECKUSER function
  await checkUser();

  return (
  <div className='fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b'>
    <nav className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link href="/">
            <Image src={"/logo.png"} alt="FinTrack Logo" width={200} height={100}
            className='h-12 w-auto object-contain'/>  
        </Link>
    

    <div className='flex items-center space-x-4'>
      {/* if signed in */}
    <SignedIn>
        <Link href={"/dashboard"} className='text-gray-500 hover:text-blue-600 
        flex items-center gap-2'>
            <Button variant={"outline"}>
                <LayoutDashboard size={20}/>
                {/* Dashboard text will be not visible when less than medium screen size,
                only icon will be displayed */}
                <span className='hidden md:inline'>Dashboard</span>
            </Button>
        </Link>
        <Link href={"/transaction/create"} className='flex items-center gap-2'>
            <Button>
                <PenBox size={18}/>
                {/* Dashboard text will be not visible when less than medium screen size,
                only icon will be displayed */}
                <span className='hidden md:inline'>Add Transaction</span>
            </Button>
        </Link>
    </SignedIn>
    {/* if signed out */}
    <SignedOut>

    <SignInButton forceRedirectUrl='/dashboard'>
        {/* making the button as sign in button */}
        <Button variant={"outline"}>Login</Button>
    </SignInButton>

    {/* forceRedirectUrl only sets the URL immediately after the button click,
     i.e., the user is sent to Clerk’s hosted sign-in/sign-up page with a query param like ?redirect_url=.... */}
    <SignUpButton forceRedirectUrl='/dashboard'>
        {/* making the button as sign in button */}
        <Button variant={"destructive"}>Sign up</Button>
    </SignUpButton>
    
  </SignedOut>

  {/* if signed in */}
  <SignedIn>
    {/* changing apperance of profile button of clerk */}
    <UserButton appearance={{
      elements:{
        avatarBox:"w-20 h-20",
      }
    }} 
    />
  </SignedIn>
    </div>
  </nav>
  </div>
  )
}

export default Header
