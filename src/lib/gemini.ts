/**
 * Google Gemini API integration for generating quizzes from study materials
 */

type QuizSettings = {
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  onProgress?: (count: number) => void;
}

type QuizQuestion = {
  type: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

type Quiz = {
  title: string;
  questions: QuizQuestion[];
}

/**
 * Function to generate a quiz using the Google Gemini API
 */
export async function getGeminiQuiz(content: string, settings: QuizSettings): Promise<Quiz> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    
    if (!apiKey) {
      throw new Error("Google API key is required. Please set NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables.")
    }
    
    // Create a better title - extract topic from first 50 chars without "Quiz on" prefix
    let title = '';
    
    try {
      // Get a title from the first paragraph or first 100 chars
      const firstParagraph = content.split('\n')[0].trim();
      title = firstParagraph.length > 10 
        ? firstParagraph.substring(0, Math.min(50, firstParagraph.length)) 
        : content.substring(0, Math.min(50, content.length));
      
      // Add ellipsis if we truncated
      if (title.length < content.length) {
        title += '...';
      }
    } catch (error) {
      // Fallback title if extraction fails
      title = 'Study Quiz';
    }
    
    // Generate questions one by one to track progress
    const questions: QuizQuestion[] = []
    const { difficulty, questionCount, onProgress } = settings
    
    // Create a prompt for the quiz based on difficulty
    const difficultyDescription = {
      easy: "basic understanding of the material, suitable for beginners",
      medium: "intermediate level that tests deeper comprehension",
      hard: "challenging questions that require critical thinking and mastery of the subject"
    }[difficulty]
    
    // Generate questions sequentially to track progress
    for (let i = 0; i < questionCount; i++) {
      // Construct prompt for this specific question
      const prompt = `
      Create a single, direct multiple-choice question based on the following study material. Make it ${difficulty} difficulty (${difficultyDescription}).
      
      Study Material: "${content.slice(0, 2000)}${content.length > 2000 ? '...' : ''}"
      
      IMPORTANT GUIDELINES:
      1. Write clear, concise questions - maximum 20 words.
      2. DO NOT add phrases like "Assuming..." or "Based on the study material...".
      3. Just ask the question directly.
      4. Keep answer options extremely brief (1-4 words is ideal).
      5. DO NOT use Roman numerals (I, II, III) in options.
      6. Make each answer choice distinct.
      7. Provide a very brief explanation for the correct answer.
      
      Format your response as a valid JSON object with the following structure:
      {
        "type": "multipleChoice",
        "question": "The question text goes here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0, // Index of correct answer (0-3)
        "explanation": "Explanation of why the answer is correct"
      }
      
      The "type" field MUST be set to "multipleChoice".
      The "correctAnswer" MUST be the index (0-3) of the correct option.
      The "explanation" MUST provide a clear explanation of why the answer is correct.
      
      Ensure the question is different from any I've asked before. This is question ${i+1} of ${questionCount}.
      `;
      
      // Call Gemini API for this question
      const questionData = await callGeminiApi(prompt, apiKey);
      
      try {
        // Parse the response
        let parsedQuestion: QuizQuestion;
        
        if (typeof questionData === 'string') {
          // Try to extract JSON from the string response using a more compatible approach
          // Find the first { and the last } in the string
          const startIdx = questionData.indexOf('{');
          const endIdx = questionData.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonString = questionData.substring(startIdx, endIdx + 1);
            try {
              parsedQuestion = JSON.parse(jsonString);
            } catch (e) {
              throw new Error("Could not parse JSON from response");
            }
          } else {
            throw new Error("Could not find JSON object in response");
          }
        } else {
          // Direct object
          parsedQuestion = questionData;
        }
        
        // Ensure the question has the correct type field
        if (!parsedQuestion.type) {
          parsedQuestion.type = "multipleChoice";
        }
        
        // Validate the question format
        if (!parsedQuestion.question || !Array.isArray(parsedQuestion.options) || 
            parsedQuestion.options.length < 2 || 
            typeof parsedQuestion.correctAnswer !== 'number' ||
            !parsedQuestion.explanation) {
          throw new Error("Invalid question format returned from API");
        }
        
        questions.push(parsedQuestion);
        
        // Update progress
        if (onProgress) {
          onProgress(i + 1);
        }
      } catch (error) {
        console.error("Error parsing question:", error);
        // Create a fallback question if parsing fails
        questions.push({
          type: "multipleChoice",
          question: `Question ${i + 1} about the study material (${difficulty} difficulty)`,
          options: [
            "First option", 
            "Second option", 
            "Third option", 
            "Fourth option"
          ],
          correctAnswer: 0,
          explanation: "This is a fallback question due to an error in generating the content."
        });
        
        if (onProgress) {
          onProgress(i + 1);
        }
      }
      
      // Add a small delay between questions to avoid rate limiting
      if (i < questionCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return {
      title,
      questions
    }
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error)
    throw error
  }
}

/**
 * Call the Gemini API with the given prompt
 */
async function callGeminiApi(prompt: string, apiKey: string) {
  try {
    // For local development, we'll use this placeholder
    // In a real app, you'd call the actual Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`)
    }

    const data = await response.json()
    const resultText = data.candidates[0].content.parts[0].text

    return resultText
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

/**
 * Generate a mock quiz as fallback if API fails
 */
function generateMockQuiz(content: string, settings: QuizSettings): Quiz {
  const { difficulty, questionCount, onProgress } = settings
  
  // Create a simple title from the first few words of the content
  let title = '';
  try {
    const firstParagraph = content.split('\n')[0].trim();
    title = firstParagraph.length > 10 
      ? firstParagraph.substring(0, Math.min(50, firstParagraph.length)) 
      : content.substring(0, Math.min(50, content.length));
    
    // Add ellipsis if we truncated
    if (title.length < content.length) {
      title += '...';
    }
  } catch (error) {
    title = 'Study Quiz';
  }
  
  // Generate mock questions based on settings
  const questions: QuizQuestion[] = []
  
  for (let i = 0; i < questionCount; i++) {
    questions.push({
      type: "multipleChoice",
      question: `Sample question ${i + 1} based on the study material (${difficulty} difficulty)`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`
      ],
      correctAnswer: Math.floor(Math.random() * 4), // Random correct answer 0-3
      explanation: `This is the explanation for question ${i + 1}. In a real application, this would provide details about why the correct answer is correct.`
    })
    
    // Call the progress callback if provided
    if (onProgress) {
      onProgress(i + 1);
    }
  }
  
  return {
    title,
    questions
  }
}

/**
 * In a real implementation, this would be the function that calls the Gemini API
 * The code below demonstrates how this might be structured
 */
/*
async function callGeminiApi(prompt: string, apiKey: string): Promise<any> {
  const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
  
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Error calling Gemini API')
  }
  
  return data
}
*/ 