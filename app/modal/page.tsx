'use client'

import React, { useState } from 'react'
import { Button } from 'react-bootstrap'

import Modal from '@/components/Modal'

export default function ModalPage (): React.JSX.Element {
  const [modalIsOpen, setIsOpen] = useState(false)

  const closeModal = (): void => {
    setIsOpen(false)
  }

  return (
    <>
      <div id='Modal'>
        <Button onClick={() => { setIsOpen(true) }}>Open Modal</Button>
        <Modal modalIsOpen={modalIsOpen} closeModal={closeModal}>
          hogehoge
        </Modal>
      </div>
    </>
  )
}
