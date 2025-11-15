'use client'

import React from 'react'
import ReactModal from 'react-modal'

import { IoIosCloseCircle } from 'react-icons/io'

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    minWidth: '40%',
    maxWidth: '80%',
    minHeight: '40%',
    maxHeight: '80%'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  }
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  zIndex: 1001,
  cursor: 'pointer'
}

interface Props {
  modalIsOpen: boolean
  closeModal: () => void
  contentLabel?: string
  styles?: ReactModal.Styles
  children: React.ReactNode
}

export default function Modal (props: Props): React.JSX.Element {
  const {
    modalIsOpen,
    closeModal,
    contentLabel,
    styles = {},
    children
  } = props

  return (
    <ReactModal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={{ ...customStyles, ...styles }}
      contentLabel={contentLabel}
    >
      <>
        {children}
        <IoIosCloseCircle
          style={closeButtonStyle}
          onClick={closeModal}
        />
      </>
    </ReactModal>
  )
}
