'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import Header from '@/app/components/header'
import WelcomeScreen from '@/app/components/welcome-screen'
import { fetchAppParams, fetchChatList, fetchConversations, sendChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import { useApp } from '@/hooks/use-app'
import { useAuth } from '@/app/components/providers/auth-provider'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import { userInputsFormToPromptVariables } from '@/utils/prompt'
import { getOrCreateSessionId } from '@/lib/session-manager'
import { toDifyFileProxyUrl } from '@/lib/dify-file-url'

export interface IMainProps {
  params: any
  appId?: string // Multi-App 지원: 동적 앱 ID
}

const Main: FC<IMainProps> = ({ appId: propAppId }) => {
  const { t, i18n } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const appId = propAppId ?? ''
  const hasSetAppConfig = !!appId

  // 사용자 정보 및 앱 다국어 정보
  const { user } = useAuth()
  const { app } = useApp()

  // 현재 언어에 따른 앱 이름 선택
  const displayAppName = (() => {
    if (!app) { return APP_INFO?.title || '' }
    if (i18n.language === 'ko') {
      return app.nameKo || app.name || APP_INFO?.title || ''
    }
    return app.nameEn || app.nameKo || app.name || APP_INFO?.title || ''
  })()

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  // in mobile, show sidebar by click button
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  // Phase 8c: sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(prev => !prev)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  useEffect(() => {
    if (displayAppName) {
      document.title = `${displayAppName} - DGIST AI`
    }
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
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)

  // Check if we're on the welcome screen (no conversation selected or new conversation with no messages)
  const isWelcomeScreen = !currConversationId || (isNewConversation && !isChatStarted)

  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    // parse variables in introduction
    setChatList(generateNewChatListWithOpenStatement('', inputs))
  }

  // Handle message send from welcome screen
  const handleWelcomeSend = (message: string, files?: VisionFile[]) => {
    // Start a new chat
    handleStartChat({})
    // Then send the message
    setTimeout(() => {
      handleSend(message, files)
    }, 100)
  }

  const hasSetInputs = (() => {
    if (!isNewConversation) { return true }
    return isChatStarted
  })()

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const handleConversationSwitch = () => {
    if (!inited) { return }

    // update inputs of current conversation
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

    // update chat list of current conversation
    if (!isNewConversation && currConversationId && !conversationIdChangeBecauseOfNew && !isResponding) {
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

    if (isNewConversation && isChatStarted) { setChatList(generateNewChatListWithOpenStatement()) }
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, appId)
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  // Auto-scroll is now handled inside Chat component

  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = () => {
    // if new chat is already exist, do not create new chat
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

  // sometime introduction is not applied to state
  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) { calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables) }

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
      suggestedQuestions,
    }
    if (calculatedIntroduction) { return [openStatement] }

    return []
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
        // handle current conversation id
        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
          return
        }
        const _conversationId = getConversationIdFromStorage(appId)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        // fetch new conversation info
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

        setInited(true)
      }
      catch (e: any) {
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

    const inputLens = Object.values(currInputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length

    const emptyInput = inputLens < promptVariablesLens || Object.values(currInputs).find(v => !v)
    if (emptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [controlFocus, setControlFocus] = useState(0)
  const [openingSuggestedQuestions, setOpeningSuggestedQuestions] = useState<string[]>([])
  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)
  const [userQuery, setUserQuery] = useState('')

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
    // closesure new list is outdated.
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

    // 새 대화인 경우 첫 메시지 기반 임시 제목 설정
    if (isNewConversation && conversationList.some(item => item.id === '-1')) {
      const tempTitle = message.slice(0, 30) + (message.length > 30 ? '...' : '')
      setConversationList(produce(conversationList, (draft) => {
        const newConvIndex = draft.findIndex(item => item.id === '-1')
        if (newConvIndex !== -1) {
          draft[newConvIndex].name = tempTitle
        }
      }))
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

    // question
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

    // answer
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
          if (lastThought) { lastThought.thought = lastThought.thought + message } // need immer setAutoFreeze
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        setMessageTaskId(taskId)
        // has switched to other conversation
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
            setConversationList(allConversations as any)
          }
          catch (e) {
            console.warn('Failed to fetch conversations:', e)
          }
        }
        resetNewConversationInputs()
        setChatNotStarted()
        setCurrConversationId(tempNewConversationId, appId, true)
        // conversationIdChangeBecauseOfNew를 마지막에 설정하여
        // handleConversationSwitch에서 fetchChatList 호출 방지 (citation 유실 방지)
        setTimeout(() => setConversationIdChangeBecauseOfNew(false), 100)
        setRespondingFalse()
      },
      onFile(file) {
        if (file.url)
        { file.url = toDifyFileProxyUrl(file.url, appId) }

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
        // responseItem.id = thought.message_id;
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // thought changed but still the same thought, so update.
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        // has switched to other conversation
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
        // Citation/Reference 데이터 처리
        if (messageEnd.metadata?.retriever_resources) {
          responseItem.citation = messageEnd.metadata.retriever_resources
        }
        // Phase 8c: suggested_questions 수집 (Dify에서 제공하는 경우)
        if (messageEnd.metadata?.suggested_questions && messageEnd.metadata.suggested_questions.length > 0) {
          responseItem.suggestedQuestions = messageEnd.metadata.suggested_questions
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
      onError() {
        setRespondingFalse()
        // role back placeholder answer
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
      onWorkflowStarted: ({ workflow_run_id, task_id }) => {
        // taskIdRef.current = task_id
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

  // Phase 8c: 대화 삭제 핸들러 (dbSessionId 우선, fallback: Dify conversation_id)
  const handleDeleteConversation = async (id: string) => {
    const conv = conversationList.find(c => c.id === id)
    const targetId = conv?.dbSessionId || id
    try {
      const sessionId = getOrCreateSessionId()
      const res = await fetch(`/api/apps/${appId}/sessions/${targetId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
        },
      })
      // 성공 또는 404(DB에 없는 Dify 전용 대화)인 경우 목록에서 제거
      if (res.ok || res.status === 404) {
        setConversationList(conversationList.filter(item => item.id !== id))
        if (currConversationId === id) {
          setCurrConversationId('-1', appId)
        }
        notify({ type: 'success', message: t('app.sidebar.deleteSuccess') })
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e)
    }
  }

  // Phase 8c: 대화 이름 변경 핸들러 (dbSessionId 우선, fallback: Dify conversation_id)
  const handleRenameConversation = async (id: string, newName: string) => {
    const conv = conversationList.find(c => c.id === id)
    const targetId = conv?.dbSessionId || id
    try {
      const sessionId = getOrCreateSessionId()
      const res = await fetch(`/api/apps/${appId}/sessions/${targetId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
        },
        body: JSON.stringify({ action: 'rename', customTitle: newName }),
      })
      if (res.ok) {
        setConversationList(produce(conversationList, (draft) => {
          const item = draft.find(c => c.id === id)
          if (item) {
            item.customTitle = newName
            item.name = newName
          }
        }))
        notify({ type: 'success', message: t('app.sidebar.renameSuccess') })
      }
    } catch (e) {
      console.error('Failed to rename conversation:', e)
    }
  }

  // Phase 8c: 대화 고정/해제 핸들러 (dbSessionId 우선, fallback: Dify conversation_id)
  const handlePinConversation = async (id: string, isPinned: boolean) => {
    const conv = conversationList.find(c => c.id === id)
    const targetId = conv?.dbSessionId || id
    try {
      const sessionId = getOrCreateSessionId()
      const res = await fetch(`/api/apps/${appId}/sessions/${targetId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
        },
        body: JSON.stringify({ action: 'pin', isPinned }),
      })
      if (res.ok) {
        setConversationList(produce(conversationList, (draft) => {
          const item = draft.find(c => c.id === id)
          if (item) {
            item.isPinned = isPinned
            item.pinnedAt = isPinned ? new Date().toISOString() : undefined
          }
        }))
        notify({
          type: 'success',
          message: isPinned ? t('app.sidebar.pinSuccess') : t('app.sidebar.unpinSuccess'),
        })
      }
    } catch (e) {
      console.error('Failed to pin conversation:', e)
    }
  }

  const renderSidebar = () => {
    if (!appId || !APP_INFO || !promptConfig) { return null }
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onPinConversation={handlePinConversation}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        userName={user?.name || user?.loginId}
      />
    )
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set appId or configure environment variables' : ''} /> }

  if (!appId || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  return (
    <div className='bg-background h-screen flex'>
      {/* 이슈 1: 사이드바를 헤더와 같은 레벨에 배치 */}
      {/* sidebar */}
      {!isMobile && renderSidebar()}
      {isMobile && isShowSidebar && (
        <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }} onClick={hideSidebar}>
          <div className='h-full inline-block' onClick={e => e.stopPropagation()}>
            {renderSidebar()}
          </div>
        </div>
      )}

      {/* Right panel: Header + Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={displayAppName}
          isMobile={isMobile}
          onShowSideBar={showSidebar}
          onCreateNewChat={() => handleConversationIdChange('-1')}
        />
        <div className='flex-1 overflow-hidden bg-muted/20'>
          {/* Welcome Screen or Chat */}
          {isWelcomeScreen
            ? (
              <WelcomeScreen
                userName={user?.name}
                onSend={handleWelcomeSend}
                isResponding={isResponding}
                visionConfig={visionConfig}
                fileConfig={fileConfig}
                suggestedQuestions={suggestedQuestions}
              />
            )
            : (
              <Chat
                chatList={chatList}
                onSend={handleSend}
                onFeedback={handleFeedback}
                isResponding={isResponding}
                checkCanSend={checkCanSend}
                visionConfig={visionConfig}
                fileConfig={fileConfig}
              />
            )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
