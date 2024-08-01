import { INTRO, LANDSCAPE, PORTRAIT } from '@lib/components/Scene/state'

export default [
  {
    url: 'index',
    title: 'INDEX',
    pageState: INTRO
  },
  {
    url: 'cv',
    title: 'CV',
    pageState: LANDSCAPE
  },
  // {
  //   url: 'services',
  //   title: 'SERVICES',
  //   pageState: LANDSCAPE
  // },
  {
    url: 'portfolio',
    title: 'PORTFOLIO',
    pageState: LANDSCAPE
  },
  {
    url: 'contacts',
    title: 'CONTACTS',
    pageState: PORTRAIT
  }
]
