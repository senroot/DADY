import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock } from 'lucide-react-native';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizCardProps {
  question: QuizQuestion;
  selectedAnswer?: number;
  showResult?: boolean;
  onAnswerSelect: (answerIndex: number) => void;
}

export function QuizCard({ question, selectedAnswer, showResult, onAnswerSelect }: QuizCardProps) {
  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option;
    }
    
    if (index === question.correctAnswer) {
      return styles.optionCorrect;
    }
    
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return styles.optionIncorrect;
    }
    
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionTextSelected : styles.optionText;
    }
    
    if (index === question.correctAnswer) {
      return styles.optionTextCorrect;
    }
    
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return styles.optionTextIncorrect;
    }
    
    return styles.optionText;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question.question}</Text>
      
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => !showResult && onAnswerSelect(index)}
            disabled={showResult}
          >
            <View style={styles.optionContent}>
              <Text style={getOptionTextStyle(index)}>{option}</Text>
              {showResult && (
                <View style={styles.resultIcon}>
                  {index === question.correctAnswer ? (
                    <CheckCircle size={20} color="#10B981" />
                  ) : selectedAnswer === index ? (
                    <XCircle size={20} color="#EF4444" />
                  ) : null}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && question.explanation && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>Explication:</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#EEF2FF',
  },
  optionCorrect: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ECFDF5',
  },
  optionIncorrect: {
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
  },
  optionTextSelected: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    flex: 1,
  },
  optionTextCorrect: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
  },
  optionTextIncorrect: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  resultIcon: {
    marginLeft: 10,
  },
  explanationContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});