'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Quiz, QuizQuestion } from '@/lib/types';

interface InteractiveQuizProps {
  quiz: Quiz;
  onComplete?: (score: number, passed: boolean) => void;
  onRetry?: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  showResults: boolean;
  score: number;
  timeRemaining?: number;
  startTime: Date;
}

export function InteractiveQuiz({ quiz, onComplete, onRetry }: InteractiveQuizProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    showResults: false,
    score: 0,
    timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : undefined,
    startTime: new Date()
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;
  const totalQuestions = quiz.questions.length;
  const progress = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (quiz.timeLimit && quizState.timeRemaining && quizState.timeRemaining > 0 && !quizState.showResults) {
      const timer = setInterval(() => {
        setQuizState(prev => {
          const newTimeRemaining = (prev.timeRemaining || 0) - 1;
          if (newTimeRemaining <= 0) {
            // Time's up - auto submit
            return {
              ...prev,
              timeRemaining: 0,
              showResults: true,
              score: calculateScore(prev.answers)
            };
          }
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz.timeLimit, quizState.timeRemaining, quizState.showResults]);

  const calculateScore = (answers: Record<string, string | string[]>) => {
    let correct = 0;
    let totalPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (userAnswer === question.correctAnswer) {
          correct += question.points;
        }
      } else if (question.type === 'short_answer') {
        // Simple string comparison for short answer (in real app, this would be more sophisticated)
        const correctAnswers = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];
        
        if (correctAnswers.some(answer => 
          typeof userAnswer === 'string' && 
          userAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
        )) {
          correct += question.points;
        }
      }
    });

    return Math.round((correct / totalPoints) * 100);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const newAnswers = {
      ...quizState.answers,
      [currentQuestion.id]: selectedAnswer
    };

    if (isLastQuestion) {
      const finalScore = calculateScore(newAnswers);
      const passed = finalScore >= quiz.passingScore;
      
      setQuizState(prev => ({
        ...prev,
        answers: newAnswers,
        showResults: true,
        score: finalScore
      }));

      onComplete?.(finalScore, passed);
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        answers: newAnswers
      }));
      setSelectedAnswer('');
      setShowExplanation(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
      
      // Load previous answer
      const prevAnswer = quizState.answers[quiz.questions[quizState.currentQuestionIndex - 1].id];
      setSelectedAnswer(prevAnswer || '');
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setQuizState({
      currentQuestionIndex: 0,
      answers: {},
      showResults: false,
      score: 0,
      timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : undefined,
      startTime: new Date()
    });
    setSelectedAnswer('');
    setShowExplanation(false);
    onRetry?.();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <div>
            <textarea
              value={selectedAnswer as string}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
            />
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (quizState.showResults) {
    const passed = quizState.score >= quiz.passingScore;
    const timeTaken = Math.floor((new Date().getTime() - quizState.startTime.getTime()) / 1000);

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {passed ? (
              <TrophyIcon className="h-16 w-16" />
            ) : (
              <XCircleIcon className="h-16 w-16" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Congratulations!' : 'Quiz Complete'}
          </CardTitle>
          <p className="text-gray-600">
            {passed 
              ? 'You passed the quiz!' 
              : `You need ${quiz.passingScore}% to pass. Keep learning and try again!`
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{quizState.score}%</div>
              <div className="text-sm text-gray-600">Your Score</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{quiz.passingScore}%</div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Time taken: {formatTime(timeTaken)}</p>
            <p>Questions answered: {Object.keys(quizState.answers).length} of {totalQuestions}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
            {passed && (
              <Button>
                Continue Learning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QuestionMarkCircleIcon className="h-6 w-6" />
              {quiz.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Question {quizState.currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {quiz.timeLimit && quizState.timeRemaining !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4" />
                <span className={quizState.timeRemaining < 60 ? 'text-red-600 font-bold' : ''}>
                  {formatTime(quizState.timeRemaining)}
                </span>
              </div>
            )}
            <Badge variant="outline">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          {renderQuestion()}
        </div>

        {/* Explanation (if available and answer selected) */}
        {selectedAnswer && currentQuestion.explanation && showExplanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
            <p className="text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePreviousQuestion}
            disabled={quizState.currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {selectedAnswer && currentQuestion.explanation && !showExplanation && (
              <Button
                onClick={() => setShowExplanation(true)}
                variant="ghost"
              >
                Show Explanation
              </Button>
            )}
            
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}