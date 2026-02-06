'use client'

import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import type { CitationItem } from '../type'
import { cn } from '@/lib/utils'

interface CitationProps {
  citations: CitationItem[]
  className?: string
}

const Citation: FC<CitationProps> = ({ citations, className }) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set())

  if (!citations || citations.length === 0) {
    return null
  }

  const toggleItem = (segmentId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId)
    }
    else {
      newExpanded.add(segmentId)
    }
    setExpandedItems(newExpanded)
  }

  const toggleContent = (segmentId: string) => {
    const newExpanded = new Set(expandedContent)
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId)
    }
    else {
      newExpanded.add(segmentId)
    }
    setExpandedContent(newExpanded)
  }

  // 점수에 따라 정렬 (높은 점수 순)
  const sortedCitations = [...citations].sort((a, b) => (b.score || 0) - (a.score || 0))

  return (
    <div className={cn('mt-3 border-t border-gray-100 pt-3', className)}>
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="font-medium">
          {t('app.citation.title', { count: citations.length })}
        </span>
        {isExpanded
          ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          )
          : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          )}
      </button>

      {/* 출처 목록 */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sortedCitations.map((citation, index) => (
            <div
              key={citation.segment_id || index}
              className="bg-gray-50 rounded-lg p-2.5 text-xs"
            >
              {/* 문서 정보 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => toggleItem(citation.segment_id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {citation.document_name || t('app.citation.unknownDocument')}
                    </span>
                  </div>
                  {citation.dataset_name && (
                    <div className="mt-0.5 ml-5.5 text-muted-foreground">
                      {citation.dataset_name}
                    </div>
                  )}
                </button>
                {citation.score && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex-shrink-0">
                    {Math.round(citation.score * 100)}%
                  </span>
                )}
              </div>

              {/* 콘텐츠 (펼침 시) */}
              {expandedItems.has(citation.segment_id) && citation.content && (
                <div className="mt-2 pl-5.5 text-muted-foreground border-l-2 border-gray-200 ml-2">
                  <p className={cn(
                    'whitespace-pre-wrap break-words',
                    !expandedContent.has(citation.segment_id) && 'line-clamp-5',
                  )}>
                    {citation.content}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleContent(citation.segment_id)
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {expandedContent.has(citation.segment_id)
                        ? t('app.citation.showLess')
                        : t('app.citation.showMore')}
                    </button>
                    {citation.word_count && (
                      <span className="text-[10px] text-muted-foreground/70">
                        {t('app.citation.wordCount', { count: citation.word_count })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(Citation)
