import React from 'react'
import Image from 'next/image'

import setting from '@/setting'

export default function Home (): React.JSX.Element {
  return (
    <>
      <div id='Index' className='d-flex flex-column align-items-center'>
        <h1>{setting.title}</h1>
        <Image id='Logo' className='mt-3 mw-100 border rounded-circle' width={100} height={100} src='/tako.png' alt='Logo' />
      </div>
    </>
  )
}
