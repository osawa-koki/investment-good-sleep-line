'use client'

import React, { useState } from 'react'
import { Button, Alert, Form } from 'react-bootstrap'

const mailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/

export default function ContactPage (): React.JSX.Element {
  const [count, setCount] = useState(0)
  const [email, setEmail] = useState('')

  return (
    <>
      <div id='Contact'>
        <h1>Dummy Contact.</h1>
        <p className='mt-3'>
          仮想DOMによってJSで管理しているデータを中心にHTMLを生成することができます。
          <br />
          <br />
          `AddEventListener`や`JQuery(&quot;***&quot;).on`なんて使いません。
          <br />
          <br />
          ちなみに、Next.js(React)は単方向バインディングであるため、HTMLをそのまま操作することはせずに、JSによるデータを操作することで描写するHTMLを制御します。
          <br />
          <br />
          この点がVue.jsやAngularと異なります。
          <br />
          <br />
          また、react-bootstrapによるBootstrapのサポートがあるため、簡単にBootstrapを導入できます。
        </p>
        <hr />
        <Alert variant='info'>You cliecked {count} times 🤣🤣🤣</Alert>
        <Button
          variant='primary'
          onClick={() => {
            setCount(count + 1)
          }}
        >
          Click Me{' '}
          {(count % 3 === 0 && count !== 0) || count.toString().includes('3')
            ? '🤪'
            : '😀'}
        </Button>
        <hr />
        <Form.Group className='mt-3'>
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type='email'
            placeholder='Enter email'
            value={email}
            onInput={(e) => {
              setEmail(e.currentTarget.value)
            }}
          />
          <Form.Text>
            We&apos;ll never share your email with anyone else.
          </Form.Text>
        </Form.Group>
        {mailRegex.test(email)
          ? (
          <Alert variant='success'>Your email is valid.</Alert>
            )
          : (
          <Alert variant='danger'>Your email is invalid.</Alert>
            )}
      </div>
    </>
  )
}
