import HeaderBar from './components/HeaderBar'
import IdleScreen from './components/IdleScreen'
import SearchingScreen from './components/SearchingScreen'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import { useChatStore } from './state/useChatStore'

export default function App() {
  const { status } = useChatStore()
  return (
    <div className="h-dvh flex flex-col min-h-0">
      <HeaderBar />
      {status === 'idle' && <IdleScreen />}
      {status === 'searching' && <SearchingScreen />}
      {status === 'matched' && (
        <div className="flex-1 min-h-0 flex flex-col max-w-2xl w-full mx-auto">
          <MessageList />   
          <MessageInput />
        </div>
      )}
    </div>
  )
}

