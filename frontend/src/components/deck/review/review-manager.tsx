'use client'

import { useState } from 'react'
import { ModeSelector } from './mode-selector'
import { FlashcardSession } from './flashcard/flashcard-session'
import { QuizSetup, QuizMode } from './quiz/quiz-setup'
import { QuizSession } from './quiz/quiz-session'

interface ReviewManagerProps {
  vocabList: any[]
}

type ViewState = 'selection' | 'flashcard' | 'quiz_setup' | 'quiz_session'

export function ReviewManager({ vocabList }: ReviewManagerProps) {
  const [view, setView] = useState<ViewState>('selection')
  const [quizMode, setQuizMode] = useState<QuizMode>('meaning') // Mặc định

  // 1. Màn hình chọn (Flashcard / Quiz)
  if (view === 'selection') {
    return <ModeSelector onSelect={(mode) => {
        if (mode === 'flashcard') setView('flashcard')
        else setView('quiz_setup')
    }} />
  }

  // 2. Màn hình Flashcard
  if (view === 'flashcard') {
    return <FlashcardSession vocabList={vocabList} onExit={() => setView('selection')} />
  }

  // 3. Màn hình Setup Quiz
  if (view === 'quiz_setup') {
    return <QuizSetup 
        onStart={(mode) => {
            setQuizMode(mode)
            setView('quiz_session')
        }} 
        onBack={() => setView('selection')} 
    />
  }

  // 4. Màn hình Chơi Quiz
  if (view === 'quiz_session') {
    return <QuizSession 
        vocabList={vocabList} 
        mode={quizMode} 
        onExit={() => setView('quiz_setup')} 
    />
  }

  return null
}