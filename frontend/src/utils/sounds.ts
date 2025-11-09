import { Howl } from 'howler'

export const sfx = {
  joined: new Howl({ src: ['/sfx/joined.mp3'], volume: 0.2 }),
  left:   new Howl({ src: ['/sfx/left.mp3'],   volume: 0.2 }),
  send:   new Howl({ src: ['/sfx/send.mp3'],   volume: 0.2 }),
  recv:   new Howl({ src: ['/sfx/recv.mp3'],   volume: 0.2 }),
}