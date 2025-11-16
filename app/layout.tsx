'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { usePathname } from 'next/navigation'

import { ToastContainer } from 'react-toastify'

import '@/styles/style.scss'
import '@/styles/menu.scss'

import setting from '@/setting'
import Menu from '@/components/Menu'
import { SettingsProvider } from '@/contexts/SettingsContext'

const CHARSET = 'utf-8'
const VIEWPORT_CONTENT = 'initial-scale=1.0, width=device-width'
const FAVICON_TYPE = 'image/x-icon'
const EMPTY_STRING = ''
const KEYWORDS_MIN_LENGTH = 0

export default function RootLayout ({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const pathname = usePathname()

  const [currentPage, setCurrentPage] = useState<string | null>(null)

  useEffect(() => {
    const path = window.location.pathname
    setCurrentPage(path)
  }, [pathname])

  const basePath = setting.basePath ?? EMPTY_STRING
  const faviconHref = `${basePath}/favicon.ico`
  const keywordsMeta = setting.keywords.length > KEYWORDS_MIN_LENGTH ? setting.keywords.join(',') : EMPTY_STRING

  return (
    <html lang="ja">
      <head>
        <meta charSet={CHARSET} />
        <link rel="shortcut icon" href={faviconHref} type={FAVICON_TYPE} />
        <meta name='viewport' content={VIEWPORT_CONTENT} />
        <title>{setting.title}</title>
        <meta name='description' content={setting.description} />
        {setting.keywords.length > KEYWORDS_MIN_LENGTH && (
          <meta name='keywords' content={keywordsMeta} />
        )}
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <SettingsProvider>
            <div id="Wrapper">
              <main>{children}</main>
              <Menu currentPage={currentPage} />
              <ToastContainer />
            </div>
            <footer>
              <a
                href='https://github.com/osawa-koki'
                target='_blank'
                rel='noreferrer'
              >
                @osawa-koki
              </a>
            </footer>
          </SettingsProvider>
        </Suspense>
      </body>
    </html>
  )
}
