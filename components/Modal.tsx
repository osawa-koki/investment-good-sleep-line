'use client'

import React, { useEffect } from 'react'
import ReactModal from 'react-modal'

import { IoIosCloseCircle } from 'react-icons/io'

const MODAL_TOP_POSITION = '50%'
const MODAL_LEFT_POSITION = '50%'
const MODAL_TRANSFORM = 'translate(-50%, -50%)'
const MODAL_MIN_WIDTH = '40%'
const MODAL_MAX_WIDTH = '80%'
const MODAL_MIN_HEIGHT = '40%'
const MODAL_MAX_HEIGHT = '80%'
const OVERLAY_BACKGROUND = 'rgba(0, 0, 0, 0.5)'
const OVERLAY_Z_INDEX = 1000
const CLOSE_BUTTON_TOP = '10px'
const CLOSE_BUTTON_RIGHT = '10px'
const CLOSE_BUTTON_Z_INDEX = 1001

const customStyles = {
  content: {
    top: MODAL_TOP_POSITION,
    left: MODAL_LEFT_POSITION,
    right: 'auto',
    bottom: 'auto',
    transform: MODAL_TRANSFORM,
    minWidth: MODAL_MIN_WIDTH,
    maxWidth: MODAL_MAX_WIDTH,
    minHeight: MODAL_MIN_HEIGHT,
    maxHeight: MODAL_MAX_HEIGHT
  },
  overlay: {
    backgroundColor: OVERLAY_BACKGROUND,
    zIndex: OVERLAY_Z_INDEX
  }
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: CLOSE_BUTTON_TOP,
  right: CLOSE_BUTTON_RIGHT,
  zIndex: CLOSE_BUTTON_Z_INDEX,
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

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      ReactModal.setAppElement('body')
    }
  }, [])

  const mergedStyles = { ...customStyles, ...styles }

  return (
    <ReactModal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={mergedStyles}
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
