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

  const handleMenuClose = (): void => {
    setMenuOpen(false)
  }

  const handleMenuOpen = (): void => {
    setMenuOpen(true)
  }

  // basePathを除去した現在のパスを取得
  const basePath = setting.basePath ?? ''
  const normalizedCurrentPage = currentPage !== null && currentPage !== undefined && basePath !== ''
    ? currentPage.replace(basePath, '')
    : currentPage

  return (
    <>
      <div id='Menu' className={menuOpen ? 'on' : ''}>
        {pages.map((page, index: number) => (
          <Link
            key={index}
            href={page.path}
            className={`btn ${
              normalizedCurrentPage === page.path
                ? 'btn-primary active'
                : ''
            }`}
            onClick={handleMenuClose}
          >
            {page.emoji}&nbsp;{page.name}
          </Link>
        ))}
      </div>
      <div id='ToMenu'>
        <Button
          id='Closer'
          variant='primary'
          className={`btn-close btn-close-white ${menuOpen ? 'on' : ''}`}
          onClick={handleMenuClose}
        ></Button>
        <BsGearFill
          id='Opener'
          className={menuOpen ? 'off' : ''}
          onClick={handleMenuOpen}
        ></BsGearFill>
      </div>
    </>
  )
}

export default Menu
