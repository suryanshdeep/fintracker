import React, { Suspense } from 'react'
import DashboardPage from './page'
import {BarLoader} from "react-spinners"

const DashboardLayout = () => {
return (
    <div className='px-5'>
      
        <h1 className='text-6xl font-bold gradient-title mb-5 animate-gradient'>DashBoard</h1>
      
      {/* dashboard Page */}

      {/* Dashboard page between suspense so that during async 
      operation it will show the loader automatically */}
      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color='#933ea'/>}>
      <DashboardPage/>
      </Suspense>
    </div>
  )
}

export default DashboardLayout