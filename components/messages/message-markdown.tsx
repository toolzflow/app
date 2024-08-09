import React, { FC, memo, useMemo, useState } from "react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { MessageCodeBlock } from "./message-codeblock"
import { MessageMarkdownMemoized } from "./message-markdown-memoized"
import { defaultUrlTransform } from "react-markdown"
import { ImageWithPreview } from "@/components/image/image-with-preview"
import { Button } from "@/components/ui/button"
import { FileIcon } from "@/components/ui/file-icon"
import rehypeMathjax from "rehype-mathjax"
import rehypeKatex from "rehype-katex"
import { cn } from "@/lib/utils"

interface MessageMarkdownProps {
  isGenerating?: boolean
  experimentalCodeEditor?: boolean
  content: string
  onPreviewContent?: (content: {
    content: string
    filename?: string
    update: boolean
  }) => void
}

function urlTransform(url: string) {
  if (url.startsWith("data:")) {
    return url
  }
  return defaultUrlTransform(url)
}

const CodePreviewButton = memo(
  ({
    isGenerating,
    fileName,
    language,
    onClick
  }: {
    isGenerating?: boolean
    fileName: string
    language: string
    onClick: () => void
  }) => {
    return (
      <Button
        variant={"outline"}
        size={"lg"}
        className={
          "text-foreground flex h-auto w-[260px] items-center justify-start space-x-1 overflow-hidden rounded-lg p-3 text-left font-sans hover:shadow"
        }
        onClick={onClick}
      >
        <div className={cn("size-10", isGenerating ? "animate-pulse" : "")}>
          <FileIcon type={fileName.split(".")[1] || language} />
        </div>
        <div className={"flex flex-col overflow-hidden"}>
          <div>{fileName}</div>
          <span className="text-foreground/60 line-clamp-1 text-ellipsis whitespace-pre-wrap text-xs font-normal">
            Click to view file
          </span>
        </div>
      </Button>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isGenerating === nextProps.isGenerating &&
      prevProps.fileName === nextProps.fileName &&
      prevProps.language === nextProps.language
    )
  }
)

CodePreviewButton.displayName = "CodePreviewButton"

export const MessageMarkdown: FC<MessageMarkdownProps> = ({
  isGenerating,
  experimentalCodeEditor = false,
  content,
  onPreviewContent
}) => {
  const handleEditorOpen = (
    fileName: string,
    language: string,
    code: string
  ) => {
    onPreviewContent?.({
      filename: fileName,
      content: language + "\n" + code,
      update: false
    })
  }

  return (
    <MessageMarkdownMemoized
      className={cn(
        "prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 min-h-[40px] min-w-full space-y-6 break-words",
        isGenerating ? "generating" : ""
      )}
      // remarkPlugins={[remarkGfm, remarkMath]}
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
      rehypePlugins={[rehypeMathjax]}
      urlTransform={urlTransform}
      components={{
        a({ children, ...props }) {
          if (typeof children === "string" && /^\d+$/.test(children)) {
            return (
              <a
                {...props}
                title={props.href}
                target={"_blank"}
                className="bg-foreground/20 ml-1 inline-flex size-[16px] items-center justify-center rounded-full text-[10px] no-underline"
              >
                {children}
              </a>
            )
          }
          return <a {...props}>{children}</a>
        },
        p({ children }) {
          return (
            <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
          )
        },
        img({ node, src, ...props }) {
          return <ImageWithPreview src={src!} alt={props.alt || "image"} />
        },
        pre({ node, children, ...props }) {
          return <>{children}</>
        },
        code({ node, className, children, ...props }) {
          const childArray = React.Children.toArray(children)
          const firstChild = childArray[0] as React.ReactElement
          const firstChildAsString = React.isValidElement(firstChild)
            ? (firstChild as React.ReactElement).props.children
            : firstChild

          if (firstChildAsString === "▍") {
            return <span className="mt-1 animate-pulse cursor-default">▍</span>
          }

          if (typeof firstChildAsString === "string") {
            childArray[0] = firstChildAsString.replace("`▍`", "▍")
          }

          const match = /language-(\w+)/.exec(className || "")

          if (
            typeof firstChildAsString === "string" &&
            !firstChildAsString.includes("\n")
          ) {
            return (
              <code className={className} {...props}>
                {childArray}
              </code>
            )
          }

          const language = (match && match[1]) || ""

          const regexFileName = /^#filename=(.*)#/

          const fileContent = String(childArray).replace(/\n$/, "")

          const matchedNames = fileContent.match(regexFileName)
          const fileContentWithoutFileName = fileContent.replace(
            regexFileName,
            ""
          )

          if (matchedNames) {
            const fileName = matchedNames[1]

            if (experimentalCodeEditor) {
              onPreviewContent?.({
                filename: fileName,
                content: language + "\n" + fileContentWithoutFileName,
                update: true
              })

              function handleOnClick() {
                handleEditorOpen(fileName, language, fileContentWithoutFileName)
              }

              return (
                <CodePreviewButton
                  fileName={fileName}
                  isGenerating={isGenerating}
                  language={language}
                  onClick={handleOnClick}
                />
              )
            }
          }

          // eslint-disable-next-line tailwindcss/no-contradicting-classname

          return (
            <MessageCodeBlock
              isGenerating={isGenerating}
              language={(match && match[1]) || ""}
              value={fileContentWithoutFileName}
              {...props}
            />
          )
        }
      }}
    >
      {content}
    </MessageMarkdownMemoized>
  )
}
