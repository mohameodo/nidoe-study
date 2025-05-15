"use client"

import { useState, useEffect } from "react"
import { Check, X, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/context/settings-context"

// Types for different quiz question formats
export type MultipleChoiceQuestion = {
  type: "multipleChoice"
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export type ShortAnswerQuestion = {
  type: "shortAnswer"
  question: string
  answers: string[] // Array of acceptable answers
  explanation: string
}

export type MatchingQuestion = {
  type: "matching"
  question: string
  pairs: Array<{ term: string; definition: string }>
  explanation: string
}

export type PuzzleQuestion = {
  type: "puzzle"
  question: string
  steps: Array<{
    prompt: string
    answer: string
    hint?: string
  }>
  explanation: string
}

export type QuizQuestion = 
  | MultipleChoiceQuestion 
  | ShortAnswerQuestion 
  | MatchingQuestion 
  | PuzzleQuestion

type AnswerBlockProps = {
  question: QuizQuestion
  onAnswered: (answer: any) => void
  showExplanation: boolean
  hideCorrectness?: boolean
  previousAnswer?: any
}

export default function AnswerBlock({ 
  question, 
  onAnswered,
  showExplanation,
  hideCorrectness = false,
  previousAnswer
}: AnswerBlockProps) {
  const { settings } = useSettings()
  
  // Render different answer blocks based on question type
  switch (question.type) {
    case "multipleChoice":
      return (
        <MultipleChoiceBlock 
          question={question} 
          onAnswered={onAnswered} 
          showExplanation={showExplanation}
          hideCorrectness={hideCorrectness}
          previousAnswer={previousAnswer}
        />
      )
    case "shortAnswer":
      return (
        <ShortAnswerBlock 
          question={question} 
          onAnswered={onAnswered} 
          showExplanation={showExplanation}
          hideCorrectness={hideCorrectness}
          previousAnswer={previousAnswer}
        />
      )
    case "matching":
      return (
        <MatchingBlock 
          question={question} 
          onAnswered={onAnswered} 
          showExplanation={showExplanation}
          hideCorrectness={hideCorrectness}
          previousAnswer={previousAnswer}
        />
      )
    case "puzzle":
      return (
        <PuzzleBlock 
          question={question} 
          onAnswered={onAnswered} 
          showExplanation={showExplanation}
          hideCorrectness={hideCorrectness}
          previousAnswer={previousAnswer}
        />
      )
    default:
      return <div>Unsupported question type</div>
  }
}

// Multiple Choice component
function MultipleChoiceBlock({ 
  question, 
  onAnswered,
  showExplanation,
  hideCorrectness = false,
  previousAnswer
}: { 
  question: MultipleChoiceQuestion
  onAnswered: (answer: any) => void
  showExplanation: boolean
  hideCorrectness?: boolean
  previousAnswer?: number
}) {
  // Initialize with previously saved answer if available
  const [selectedOption, setSelectedOption] = useState<number | null>(previousAnswer !== undefined ? previousAnswer : null)
  const [isSubmitted, setIsSubmitted] = useState(previousAnswer !== undefined)
  const isCorrect = selectedOption === question.correctAnswer
  
  // Reset state when question changes, unless we have a previous answer
  useEffect(() => {
    if (previousAnswer !== undefined) {
      setSelectedOption(previousAnswer);
      setIsSubmitted(true);
    } else {
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  }, [question.question, previousAnswer]);
  
  const handleOptionSelect = (index: number) => {
    if (!isSubmitted) {
      setSelectedOption(index)
      
      // Auto-submit after selection
      setIsSubmitted(true)
      onAnswered(index)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
              selectedOption === index 
                ? "border-primary bg-primary/5" 
                : "border-muted hover:border-primary/50 hover:bg-accent/30",
              isSubmitted && !hideCorrectness && selectedOption === index && isCorrect && "bg-green-100 dark:bg-green-900/20 border-green-500",
              isSubmitted && !hideCorrectness && selectedOption === index && !isCorrect && "bg-red-100 dark:bg-red-900/20 border-red-500",
              isSubmitted && !hideCorrectness && index === question.correctAnswer && "bg-green-100 dark:bg-green-900/20 border-green-500",
              isSubmitted && selectedOption !== index ? "opacity-60" : ""
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                selectedOption === index 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-muted-foreground/30"
              )}>
                {selectedOption === index && (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
              <span className="font-medium">{option}</span>
              {isSubmitted && !hideCorrectness && (
                <span className="ml-auto">
                  {index === question.correctAnswer && <Check className="h-5 w-5 text-green-500" />}
                  {selectedOption === index && !isCorrect && <X className="h-5 w-5 text-red-500" />}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {isSubmitted && showExplanation && (
        <div className={cn(
          "mt-4 p-4 rounded-xl",
          isCorrect ? "bg-green-100 dark:bg-green-900/20 border border-green-200" : "bg-muted border"
        )}>
          <h4 className="font-medium mb-1">Explanation</h4>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// Short Answer component
function ShortAnswerBlock({ 
  question, 
  onAnswered,
  showExplanation,
  hideCorrectness = false,
  previousAnswer
}: { 
  question: ShortAnswerQuestion
  onAnswered: (answer: any) => void
  showExplanation: boolean
  hideCorrectness?: boolean
  previousAnswer?: string
}) {
  // Initialize with previously saved answer if available
  const [answer, setAnswer] = useState(previousAnswer || "")
  const [isSubmitted, setIsSubmitted] = useState(!!previousAnswer)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  // Reset state when question changes
  useEffect(() => {
    if (previousAnswer) {
      setAnswer(previousAnswer);
      setIsSubmitted(true);
      setIsCorrect(checkAnswer(previousAnswer));
    } else {
      setAnswer("");
      setIsSubmitted(false);
      setIsCorrect(false);
    }
    setShowHint(false);
  }, [question.question, previousAnswer]);
  
  const checkAnswer = (userAnswer: string): boolean => {
    // Compare user answer with all acceptable answers (case insensitive)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase()
    return question.answers.some(
      correctAnswer => correctAnswer.toLowerCase() === normalizedUserAnswer
    )
  }
  
  const handleSubmit = () => {
    if (answer.trim() && !isSubmitted) {
      const correct = checkAnswer(answer)
      setIsCorrect(correct)
      setIsSubmitted(true)
      onAnswered(answer)
    }
  }
  
  const toggleHint = () => {
    setShowHint(prev => !prev)
  }
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Your Answer</label>
          <button 
            type="button" 
            onClick={toggleHint} 
            className="text-xs border px-2 py-1 rounded-md hover:bg-accent/50 flex items-center transition-colors"
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Hint
          </button>
        </div>
        
        {showHint && (
          <div className="text-xs bg-muted p-3 rounded-xl mb-3">
            Think about the key concepts mentioned in the question. The answer is usually 1-3 words.
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-3 rounded-xl border-2 bg-background focus:border-primary focus:ring-0 outline-none"
            placeholder="Type your answer..."
            disabled={isSubmitted}
          />
          
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
            >
              Submit
            </button>
          )}
        </div>
      </div>
      
      {isSubmitted && (
        <div className={cn(
          "p-3 rounded-xl",
          hideCorrectness ? "bg-muted" : (isCorrect ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20")
        )}>
          <div className="flex items-center">
            {!hideCorrectness ? (
              isCorrect ? (
                <>
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Correct!</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">
                    Incorrect. Acceptable answers: {question.answers.join(", ")}
                  </span>
                </>
              )
            ) : (
              <span className="font-medium">Answer submitted</span>
            )}
          </div>
        </div>
      )}
      
      {isSubmitted && showExplanation && (
        <div className="mt-2 p-3 rounded-xl bg-muted">
          <h4 className="font-medium mb-1">Explanation</h4>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// Matching component  
function MatchingBlock({ 
  question, 
  onAnswered,
  showExplanation,
  hideCorrectness = false,
  previousAnswer
}: { 
  question: MatchingQuestion
  onAnswered: (answer: any) => void
  showExplanation: boolean
  hideCorrectness?: boolean
  previousAnswer?: Record<number, number>
}) {
  // Initialize with previously saved answer if available
  const [matches, setMatches] = useState<Record<number, number>>(previousAnswer || {})
  const [isSubmitted, setIsSubmitted] = useState(!!previousAnswer)
  const [isCorrect, setIsCorrect] = useState(false)
  
  // Shuffle the definitions for display
  const [shuffledDefinitions, setShuffledDefinitions] = useState(() => {
    const defs = question.pairs.map((pair, index) => ({ 
      text: pair.definition, 
      originalIndex: index 
    }))
    return defs.sort(() => Math.random() - 0.5)
  })
  
  // Reset state when question changes
  useEffect(() => {
    if (previousAnswer) {
      setMatches(previousAnswer);
      setIsSubmitted(true);
      setIsCorrect(checkMatches(previousAnswer));
    } else {
      setMatches({});
      setIsSubmitted(false);
      setIsCorrect(false);
      
      // Reshuffle definitions
      const defs = question.pairs.map((pair, index) => ({ 
        text: pair.definition, 
        originalIndex: index 
      }))
      setShuffledDefinitions(defs.sort(() => Math.random() - 0.5));
    }
  }, [question.question, question.pairs, previousAnswer]);
  
  const handleMatch = (termIndex: number, defIndex: number) => {
    if (!isSubmitted) {
      setMatches(prev => ({
        ...prev,
        [termIndex]: defIndex
      }))
    }
  }
  
  const handleSubmit = () => {
    if (Object.keys(matches).length === question.pairs.length && !isSubmitted) {
      // Check if all matches are correct
      const allCorrect = Object.entries(matches).every(
        ([termIndex, defIndex]) => 
          shuffledDefinitions[defIndex].originalIndex === parseInt(termIndex)
      )
      
      setIsCorrect(allCorrect)
      setIsSubmitted(true)
      onAnswered(matches)
    }
  }
  
  const checkMatches = (answer: Record<number, number>): boolean => {
    return Object.entries(answer).every(
      ([termIndex, defIndex]) => 
        shuffledDefinitions[defIndex].originalIndex === parseInt(termIndex)
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-2">Terms</h4>
          {question.pairs.map((pair, termIndex) => (
            <div 
              key={`term-${termIndex}`}
              className={cn(
                "p-3 border rounded-lg",
                Object.hasOwn(matches, termIndex) ? "border-primary" : "border-muted",
                isSubmitted && shuffledDefinitions[matches[termIndex]]?.originalIndex === termIndex
                  ? "bg-green-100 dark:bg-green-900/20"
                  : isSubmitted ? "bg-red-100 dark:bg-red-900/20" : ""
              )}
            >
              {pair.term}
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-2">Definitions</h4>
          {shuffledDefinitions.map((def, defIndex) => (
            <div 
              key={`def-${defIndex}`}
              className={cn(
                "p-3 border rounded-lg cursor-pointer",
                Object.values(matches).includes(defIndex) ? "border-primary" : "border-muted",
                isSubmitted && Object.entries(matches).some(
                  ([termIndex, dIndex]) => 
                    dIndex === defIndex && parseInt(termIndex) === def.originalIndex
                )
                  ? "bg-green-100 dark:bg-green-900/20"
                  : isSubmitted ? "bg-red-100 dark:bg-red-900/20" : ""
              )}
            >
              <div className="flex justify-between items-center">
                <span>{def.text}</span>
                <select 
                  className="ml-2 text-xs bg-background border rounded p-1"
                  value={Object.entries(matches).find(([_, dIndex]) => dIndex === defIndex)?.[0] || ""}
                  onChange={(e) => handleMatch(parseInt(e.target.value), defIndex)}
                  disabled={isSubmitted}
                >
                  <option value="">Match with...</option>
                  {question.pairs.map((_, termIndex) => (
                    <option 
                      key={termIndex} 
                      value={termIndex}
                      disabled={Object.hasOwn(matches, termIndex) && matches[termIndex] !== defIndex}
                    >
                      Term {termIndex + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== question.pairs.length}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50"
        >
          Submit Matches
        </button>
      ) : (
        <div className={cn(
          "p-3 rounded-lg",
          hideCorrectness ? "bg-muted" : (isCorrect ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20")
        )}>
          <div className="flex items-center">
            {!hideCorrectness ? (
              isCorrect ? (
                <>
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">All matches are correct!</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">
                    Some matches are incorrect.
                  </span>
                </>
              )
            ) : (
              <span className="font-medium">Answer submitted</span>
            )}
          </div>
        </div>
      )}
      
      {isSubmitted && showExplanation && (
        <div className="mt-2 p-3 rounded-lg bg-muted">
          <h4 className="font-medium mb-1">Explanation</h4>
          <p className="text-sm">{question.explanation}</p>
          
          {!isCorrect && (
            <div className="mt-3">
              <h5 className="font-medium text-sm mb-1">Correct Matches:</h5>
              <ul className="text-sm space-y-1">
                {question.pairs.map((pair, index) => (
                  <li key={index}>
                    <span className="font-medium">{pair.term}</span> — {pair.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Puzzle component
function PuzzleBlock({ 
  question, 
  onAnswered,
  showExplanation,
  hideCorrectness = false,
  previousAnswer
}: { 
  question: PuzzleQuestion
  onAnswered: (answer: any) => void
  showExplanation: boolean
  hideCorrectness?: boolean
  previousAnswer?: any
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(question.steps.length).fill(""))
  const [stepStatus, setStepStatus] = useState<Array<"unattempted" | "correct" | "incorrect">>(
    Array(question.steps.length).fill("unattempted")
  )
  const [showingHint, setShowingHint] = useState(false)
  const [allCompleted, setAllCompleted] = useState(false)
  
  // Reset state when question changes
  useEffect(() => {
    if (previousAnswer) {
      // Handle previously saved puzzle answers
      try {
        if (Array.isArray(previousAnswer)) {
          // If previous answer is available, restore the state
          setCurrentStep(question.steps.length - 1); // Set to the last step
          setAllCompleted(true);
        }
      } catch (e) {
        console.error("Error restoring puzzle state:", e);
      }
    } else {
      // Reset state
      setCurrentStep(0);
      setAnswers(Array(question.steps.length).fill(""));
      setStepStatus(Array(question.steps.length).fill("unattempted"));
      setShowingHint(false);
      setAllCompleted(false);
    }
  }, [question.question, question.steps.length, previousAnswer]);
  
  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentStep] = value
    setAnswers(newAnswers)
  }
  
  const handleStepSubmit = () => {
    if (!answers[currentStep]) return
    
    const isCorrect = 
      answers[currentStep].toLowerCase().trim() === 
      question.steps[currentStep].answer.toLowerCase().trim()
    
    const newStatus = [...stepStatus]
    newStatus[currentStep] = isCorrect ? "correct" : "incorrect"
    setStepStatus(newStatus)
    
    if (isCorrect && currentStep < question.steps.length - 1) {
      // Move to next step if correct
      setCurrentStep(currentStep + 1)
      setShowingHint(false)
    } else if (isCorrect && currentStep === question.steps.length - 1) {
      // All steps completed
      setAllCompleted(true)
      onAnswered(stepStatus.map(status => status === "correct"))
    } else {
      // Incorrect answer
      onAnswered(stepStatus.map(status => status === "correct"))
    }
  }
  
  const toggleHint = () => {
    setShowingHint(!showingHint)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        {question.steps.map((_, index) => (
          <div 
            key={index}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              index === currentStep 
                ? "bg-primary text-primary-foreground" 
                : index < currentStep
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {index + 1}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-medium mb-2">
          Step {currentStep + 1}: {question.steps[currentStep].prompt}
        </h3>
        
        {showingHint && question.steps[currentStep].hint && (
          <div className="text-sm bg-muted p-2 rounded-md mb-3">
            <span className="font-medium">Hint:</span> {question.steps[currentStep].hint}
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={answers[currentStep]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="flex-1 p-2 rounded border bg-background"
              placeholder="Your answer..."
              disabled={stepStatus[currentStep] === "correct"}
            />
            {question.steps[currentStep].hint && (
              <button
                type="button"
                onClick={toggleHint}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {showingHint ? "Hide Hint" : "Hint"}
              </button>
            )}
          </div>
          
          {stepStatus[currentStep] === "incorrect" && (
            <div className="text-red-500 text-sm">
              That's not correct. Try again or use the hint.
            </div>
          )}
          
          <button
            onClick={handleStepSubmit}
            disabled={!answers[currentStep] || stepStatus[currentStep] === "correct"}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {stepStatus[currentStep] === "correct" 
              ? "Correct!" 
              : "Submit"}
          </button>
        </div>
      </div>
      
      {allCompleted && showExplanation && (
        <div className="mt-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
          <h4 className="font-medium mb-1">Puzzle Completed!</h4>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  )
} 