import { ChatbotUIContext } from "@/context/context"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, ModelProvider } from "@/types"
import { FC, useContext, useEffect, useRef } from "react"
import { ModelSelectChat } from "@/components/models/model-select-chat"
import { ToolSelect } from "@/components/tools/tool-select"
import { ModelSettings } from "@/components/models/model-settings"
import { cx } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChatbotUIChatContext } from "@/context/chat"

interface ChatSettingsProps {
  className?: string
}

export const ChatSettings: FC<ChatSettingsProps> = ({ className }) => {
  useHotkey("i", () => handleClick())

  const { chatSettings, setChatSettings } = useContext(ChatbotUIChatContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (buttonRef.current) {
      buttonRef.current.click()
    }
  }

  useEffect(() => {
    if (!chatSettings) return

    setChatSettings({
      ...chatSettings,
      temperature: Math.min(
        chatSettings.temperature,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_TEMPERATURE || 1
      ),
      contextLength: Math.min(
        chatSettings.contextLength,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_CONTEXT_LENGTH || 4096
      )
    })
  }, [chatSettings?.model])

  if (!chatSettings) return null

  const handleSelectModel = (modelId: LLMID) => {
    setChatSettings(prev => {
      return {
        ...prev,
        model: modelId
      }
    })
  }

  const handleSelectTools = () => {
    setChatSettings(prev => {
      return {
        ...prev,
        tools: !prev
      }
    })
  }

  return (
    <div
      className={cn("flex items-center justify-between space-x-1", className)}
    >
      <div className={"max-w-[360px]"}>
        <ModelSelectChat
          // showModelSettings={false}
          selectedModelId={chatSettings.model}
          onSelectModel={handleSelectModel}
        />
      </div>
    </div>
  )
}
