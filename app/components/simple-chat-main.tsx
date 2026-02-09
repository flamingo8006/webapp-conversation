'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import { MessageSquare } from 'lucide-react'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import { fetchAppParams, fetchChatList, fetchConversations, sendChatMessage, updateFeedback } from '@/service'
import { Card } from '@/components/ui/card'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import SimpleChat from '@/app/components/simple-chat'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import { useSession } from '@/hooks/use-session'
import { useApp } from '@/hooks/use-app'
import LanguageSwitcher from '@/app/components/language-switcher'

export interface ISimpleChatMainProps {
  params: any
  appId?: string
  appName?: string // 챗봇 이름 (상단 헤더 표시용) - 폴백용
}

const SimpleChatMain: FC<ISimpleChatMainProps> = ({ appId: propAppId, appName }) => {
  const { t, i18n } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const appId = propAppId || APP_ID
  const hasSetAppConfig = appId && API_KEY

  // Phase 7: 익명 사용자 세션 관리
  const { sessionId, isReady: isSessionReady } = useSession()

  // Phase 8a-2: 다국어 앱 이름 지원
  const { app } = useApp()

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  // Phase 8a-2: 현재 언어에 맞는 앱 이름 표시
  const currentLang = i18n.language
  const displayAppName = React.useMemo(() => {
    if (app) {
      return currentLang === 'ko'
        ? (app.nameKo || app.name)
        : (app.nameEn || app.nameKo || app.name)
    }
    return appName || APP_INFO?.title || ''
  }, [app, currentLang, appName])

  useEffect(() => {
    // DGIST AI로 변경
    if (displayAppName) { document.title = `${displayAppName} - DGIST AI` }
  }, [displayAppName])

  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * conversation info
  */
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted }] = useBoolean(false)

  // 자동으로 채팅 시작 (Welcome 화면 제거)
  const handleStartChat = (inputs: Record<string, any>, introduction?: string, questions?: string[]) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    setChatList(generateNewChatListWithOpenStatement(introduction || '', inputs, questions))
  }

  // 항상 입력이 설정된 것으로 간주 (Welcome 화면 표시 안함)
  const hasSetInputs = true

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const handleConversationSwitch = () => {
    if (!inited) { return }

    // 새 대화가 막 시작된 경우 handleStartChat에서 이미 처리했으므로 스킵
    if (getConversationIdChangeBecauseOfNew()) { return }

    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    if (!isNewConversation && !isResponding) {
      fetchChatList(appId, currConversationId).then((res: any) => {
        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        data.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
            // Dify API 응답에 retriever_resources가 있으면 citation으로 매핑
            citation: item.retriever_resources || item.metadata?.retriever_resources,
          })
        })
        setChatList(newChatList)
      })
    }

    if (isNewConversation && isChatStarted) {
      setChatList(generateNewChatListWithOpenStatement())
    }
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])

  const createNewChat = () => {
    if (conversationList.some(item => item.id === '-1')) { return }

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }))
  }

  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null, questions?: string[]) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) { calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables) }

    // 전달받은 questions 또는 state의 suggestedQuestions 사용
    const displayQuestions = questions || suggestedQuestions || []

    // Phase 8c: 심플형에서 항상 오프닝 스테이트먼트 표시 (AI 대화 시작 스타일)
    // introduction이 없으면 기본 환영 메시지 사용
    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction || t('app.chat.welcome'),
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: true,
      suggestedQuestions: displayQuestions,
    }
    return [openStatement]
  }

  // init
  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(appId), fetchAppParams(appId)])

        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          const errorMessage = typeof error === 'string' ? error : JSON.stringify(error)
          Toast.notify({ type: 'error', message: errorMessage })
          throw new Error(errorMessage)
        }
        const _conversationId = getConversationIdFromStorage(appId)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions = [] }: any = appParams
        // Phase 8a: 사용자 언어 설정 우선, 앱 기본 언어로 덮어쓰지 않음
        // setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions,
        })
        if (isNotNewConversation) {
          setExistConversationInfo({
            name: currentConversation.name || t('app.chat.newChatDefaultName'),
            introduction,
            suggested_questions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation) { setCurrConversationId(_conversationId, appId, false) }

        // 자동으로 새 채팅 시작 - Dify에서 받은 introduction과 suggested_questions 전달
        if (!isNotNewConversation) {
          handleStartChat({}, introduction, suggested_questions)
        }

        setInited(true)
      }
      catch (e: any) {
        console.error('SimpleChatMain init error:', e)
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1') { return true }

    if (!currInputs || !promptConfig?.prompt_variables) { return true }

    // 필수 입력 변수가 없으면 통과
    const promptVariablesLens = promptConfig.prompt_variables.length
    if (promptVariablesLens === 0) { return true }

    const inputLens = Object.values(currInputs).length
    const emptyInput = inputLens < promptVariablesLens || Object.values(currInputs).find(v => !v)
    if (emptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }
    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType) { toServerInputs[key] = transformToServerFile(value) }

        else if (value[0]?.supportFileType) { toServerInputs[key] = value.map((item: any) => transformToServerFile(item)) }

        else { toServerInputs[key] = value }
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: (files || []).filter((f: any) => f.type === 'image'),
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setRespondingTrue()
    sendChatMessage(appId, data, {
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isAgentMode) {
          responseItem.content = responseItem.content + message
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought) { lastThought.thought = lastThought.thought + message }
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        setMessageTaskId(taskId)
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (hasError) { return }

        if (getConversationIdChangeBecauseOfNew()) {
          try {
            const { data: allConversations }: any = await fetchConversations(appId)

            // SimpleChatMain에서는 대화 이름 자동 생성 제거 (선택 사항)
            // 대화 목록이 필요 없으므로 이름 생성도 스킵
            if (allConversations && allConversations.length > 0) {
              setConversationList(allConversations as any)
            }
          } catch (e) {
            console.error('Failed to fetch conversations:', e)
            // 오류가 발생해도 계속 진행
          }
        }
        resetNewConversationInputs()
        setCurrConversationId(tempNewConversationId, appId, true)
        // conversationIdChangeBecauseOfNew를 마지막에 설정하여
        // handleConversationSwitch에서 fetchChatList 호출 방지 (citation 유실 방지)
        setTimeout(() => setConversationIdChangeBecauseOfNew(false), 100)
        setRespondingFalse()
      },
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        // Citation/Reference 데이터 처리
        if (messageEnd.metadata?.retriever_resources) {
          responseItem.citation = messageEnd.metadata.retriever_resources
        }
        // Phase 8c: suggested_questions 수집 (Dify에서 제공하는 경우)
        if (messageEnd.metadata?.suggested_questions && messageEnd.metadata.suggested_questions.length > 0) {
          responseItem.suggestedQuestions = messageEnd.metadata.suggested_questions
        }

        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

              draft.push({
                ...responseItem,
              })
            },
          )
          setChatList(newListWithAnswer)
          return
        }
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError(errorMessage?: string) {
        setRespondingFalse()
        // 에러 메시지를 대화창에 표시
        setChatList(produce(getChatList(), (draft) => {
          const answerIndex = draft.findIndex(item => item.id === placeholderAnswerId)
          if (answerIndex !== -1) {
            draft[answerIndex].content = errorMessage || t('app.chat.error')
            draft[answerIndex].isError = true
          }
        }))
      },
      onWorkflowStarted: ({ workflow_run_id, task_id }) => {
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/apps/${appId}/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set appId or configure environment variables' : ''} /> }

  // Phase 7: 익명 사용자 세션 준비 대기
  if (!isSessionReady) { return <Loading type='app' /> }

  if (!appId || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* 헤더 - 고정 */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* 왼쪽: 언어 선택 */}
            <div className="w-20 sm:w-24">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* 중앙: 앱 이름 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">
                {displayAppName}
              </h1>
            </div>

            {/* 오른쪽: 균형을 위한 빈 공간 */}
            <div className="w-20 sm:w-24" />
          </div>
        </div>
      </header>

      {/* 메인 채팅 영역 */}
      <main className="absolute top-14 sm:top-16 left-0 right-0 bottom-0 px-2 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="w-full h-full max-w-4xl mx-auto">
          {/* 채팅 컨테이너 */}
          <Card className="h-full rounded-xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-hidden px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
              <div className="h-full w-full max-w-3xl mx-auto">
                <SimpleChat
                  chatList={chatList}
                  onSend={handleSend}
                  onFeedback={handleFeedback}
                  isResponding={isResponding}
                  checkCanSend={checkCanSend}
                  visionConfig={visionConfig}
                  fileConfig={fileConfig}
                  suggestedQuestions={suggestedQuestions}
                />
              </div>
            </div>

            {/* Footer - DGIST AI 로고 */}
            <div className="py-2 sm:py-3 px-3 sm:px-4 border-t bg-muted/50 flex-shrink-0">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[7px] sm:text-[8px] font-bold">D</span>
                </div>
                <span className="whitespace-nowrap">{t('app.portal.poweredBy')}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default React.memo(SimpleChatMain)
