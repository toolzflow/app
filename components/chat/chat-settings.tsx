import { ChatbotUIContext } from "@/context/context"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, ModelProvider } from "@/types"
import { FC, useContext, useEffect, useRef } from "react"
import { ModelSelectChat } from "@/components/models/model-select-chat"
import { ToolSelect } from "@/components/tools/tool-select"
import { cn } from "@/lib/utils"
import { ChatbotUIChatContext } from "@/context/chat"

interface ChatSettingsProps {
  className?: string
}

export const ChatSettings: FC<ChatSettingsProps> = ({ className }) => {
  useHotkey("i", () => handleClick())

  const {
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const { chatSettings, setChatSettings, selectedTools, setSelectedTools } =
    useContext(ChatbotUIChatContext)

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

  const allModels = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false,
      tools: false
    })),
    ...availableHostedModels,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ]

  const handleSelectModel = (modelId: LLMID) => {
    setChatSettings(prev => {
      return {
        ...prev,
        model: modelId
      }
    })
  }

  const selectedModel = allModels.find(x => x.modelId == chatSettings.model)

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {selectedModel?.tools && (
        <ToolSelect
          selectedTools={selectedTools}
          onSelectTools={setSelectedTools}
        />
      )}
      {/*<ModelSettings*/}
      {/*  chatSettings={chatSettings}*/}
      {/*  onChangeChatSettings={setChatSettings}*/}
      {/*/>*/}
      <ModelSelectChat
        selectedModelId={chatSettings.model}
        onSelectModel={handleSelectModel}
      />
    </div>
    // <Popover>
    //   <PopoverTrigger asChild>
    //     <Button
    //       ref={buttonRef}
    //       className="flex items-center space-x-2"
    //       variant="ghost"
    //     >
    //       <div className="text-lg">
    //         {fullModel?.modelName || chatSettings.model}
    //       </div>
    //
    //       <IconAdjustmentsHorizontal size={28}/>
    //     </Button>
    //   </PopoverTrigger>
    //
    //   <ModelSelect selectedModelId={chatSettings.model} onSelectModel={handleSelectModel} />
    //
    //   {/*<PopoverContent*/}
    //   {/*  // className="bg-background border-input relative flex max-h-[calc(100vh-60px)] w-[300px] flex-col space-y-4 overflow-auto rounded-lg border p-6 sm:w-[350px] md:w-[400px] lg:w-[500px] dark:border-none"*/}
    //   {/*  align="end"*/}
    //   {/*>*/}
    //
    //   {/*</PopoverContent>*/}
    // </Popover>
  )
}
