'use client'

import React from 'react'

export default function AboutPage (): React.JSX.Element {
  return (
    <>
      <div id='About'>
        <h1>Here, About page.</h1>
        <p className='mt-3'>
          Next.js大好きです。
          <br />
          本当に使いやすいです。
          <br />
          僕はTypeScript × Next.jsを強くオススメします。
          <br />
          <br />
          静的型付け言語って難しいと思われがちですが、エディタの機能が豊富な現在は型付け言語の方が簡単に書くことができます。
          <br />
          さらには字句解析と構文解析に加えて、コンパイル時に、コンパイラによる意味解析を行ってくれるため、動的型付け言語と比較して動作に信頼性があります。
          <br />
          <br />
          また、Reactと比べてNext.jsはSSGによってビルド時にHTMLが生成されるため、SPA(SSR)と比べて高速に動作し、ユーザビリティが高いです。
        </p>
      </div>
    </>
  )
}
