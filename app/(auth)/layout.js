import React from 'react'

// defining the layout for the signin and sign up page

const AuthLayout = ({children}) => {
  return (
    <div className='flex justify-center pt-40 '>
      {children}
    </div>
  )
}

export default AuthLayout
