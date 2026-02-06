'use client'

import type { FC } from 'react'
import React from 'react'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IExampleQuestionsProps {
  questions: string[]
  onQuestionClick: (question: string) => void
  variant?: 'cards' | 'list' | 'buttons'
}

const ExampleQuestions: FC<IExampleQuestionsProps> = ({
  questions,
  onQuestionClick,
  variant = 'cards',
}) => {
  if (questions.length === 0) {
    return null
  }

  // Card variant - 2x2 grid of cards
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.slice(0, 4).map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className={cn(
              'group flex items-start gap-3 p-4 rounded-xl text-left transition-all',
              'bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20',
              'hover:shadow-md',
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {question}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
          </button>
        ))}
      </div>
    )
  }

  // Buttons variant - horizontal scrollable buttons
  if (variant === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 4).map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className={cn(
              'px-4 py-2 rounded-full text-sm transition-all',
              'bg-muted/50 hover:bg-muted border border-border hover:border-primary/30',
              'text-muted-foreground hover:text-foreground',
            )}
          >
            {question.length > 30 ? `${question.slice(0, 30)}...` : question}
          </button>
        ))}
      </div>
    )
  }

  // List variant - simple list style
  return (
    <div className="space-y-2">
      {questions.slice(0, 4).map((question, index) => (
        <button
          key={index}
          onClick={() => onQuestionClick(question)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
            'hover:bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          <MessageCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{question}</span>
        </button>
      ))}
    </div>
  )
}

export default React.memo(ExampleQuestions)
