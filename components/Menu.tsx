'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { Button } from 'react-bootstrap'
import { BsGearFill } from 'react-icons/bs'

import pages from '@/pages'
import setting from '@/setting'

interface Props {
  currentPage: string | null
}

function Menu (props: Props): React.JSX.Element {
  const { currentPage } = props

  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  // basePathを除去した現在のパスを取得
  const normalizedCurrentPage = currentPage !== null && currentPage !== undefined
    ? (setting.basePath !== null && setting.basePath !== undefined && setting.basePath !== ''
        ? currentPage.replace(setting.basePath, '')
        : currentPage)
    : null

  return (
    <>
      <div id='Menu' className={menuOpen ? 'on' : ''}>
        {pages.map((page, index: number) => {
          return (
            <Link
              key={index}
              href={page.path}
              className={`btn ${
                normalizedCurrentPage === page.path
                  ? 'btn-primary active'
                  : ''
              }`}
            >
              {page.emoji}&nbsp;{page.name}
            </Link>
          )
        })}
      </div>
      <div id='ToMenu'>
        <Button
          id='Closer'
          variant='primary'
          className={`btn-close btn-close-white ${menuOpen ? 'on' : ''}`}
          onClick={() => {
            setMenuOpen(false)
          }}
        ></Button>
        <BsGearFill
          id='Opener'
          className={menuOpen ? 'off' : ''}
          onClick={() => {
            setMenuOpen(true)
          }}
        ></BsGearFill>
      </div>
    </>
  )
}

export default Menu
