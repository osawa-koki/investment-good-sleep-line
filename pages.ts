interface Page {
  emoji: string
  path: string
  name: string
}

const pages: Page[] = [
  {
    emoji: '🏠',
    path: '/',
    name: 'Home'
  },
  {
    emoji: '📖',
    path: '/about/',
    name: 'About'
  },
  {
    emoji: '⚙️',
    path: '/settings/',
    name: 'Settings'
  }
]

export default pages
