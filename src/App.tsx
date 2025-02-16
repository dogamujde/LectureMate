import React, { useState } from 'react'
import { NotesService } from './services/NotesService'

interface Course {
  id: string;
  name: string;
  weeks: Week[];
}

interface Week {
  number: number;
  title: string;
  isGenerated: boolean;
}

function App() {
  const [currentTerm, setCurrentTerm] = useState('first')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [transcript, setTranscript] = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [field, setField] = useState('')
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  const firstTermCourses = [
    {
      id: '1',
      name: 'Functional Programming',
      weeks: [
        { number: 1, title: 'Introduction to Lambda Calculus', isGenerated: false },
        { number: 2, title: 'Higher Order Functions', isGenerated: false },
        { number: 3, title: 'Recursion and Pattern Matching', isGenerated: false }
      ]
    },
    {
      id: '2',
      name: 'Introduction to Linear Algebra',
      weeks: [
        { number: 1, title: 'Vectors and Matrices', isGenerated: false },
        { number: 2, title: 'Linear Transformations', isGenerated: false },
        { number: 3, title: 'Eigenvalues and Eigenvectors', isGenerated: false }
      ]
    },
    {
      id: '3',
      name: 'Data Science',
      weeks: [
        { number: 1, title: 'Data Collection and Cleaning', isGenerated: false },
        { number: 2, title: 'Statistical Analysis', isGenerated: false },
        { number: 3, title: 'Machine Learning Basics', isGenerated: false }
      ]
    }
  ]

  const secondTermCourses = [
    {
      id: '4',
      name: 'Object Oriented Programming',
      weeks: [
        { number: 1, title: 'Classes and Objects', isGenerated: false },
        { number: 2, title: 'Inheritance and Polymorphism', isGenerated: false },
        { number: 3, title: 'Design Patterns', isGenerated: false }
      ]
    },
    {
      id: '5',
      name: 'Calculus and its Applications',
      weeks: [
        { number: 1, title: 'Limits and Continuity', isGenerated: false },
        { number: 2, title: 'Differentiation', isGenerated: false },
        { number: 3, title: 'Integration', isGenerated: false }
      ]
    },
    {
      id: '6',
      name: 'Cognitive Science',
      weeks: [
        { number: 1, title: 'Introduction to Cognition', isGenerated: false },
        { number: 2, title: 'Memory and Learning', isGenerated: false },
        { number: 3, title: 'Perception and Attention', isGenerated: false }
      ]
    }
  ]

  const courses = currentTerm === 'first' ? firstTermCourses : secondTermCourses

  const handleGenerateNotes = async () => {
    if (!transcript) return
    try {
      const result = await NotesService.generateNotes(transcript)
      // Handle generated notes
    } catch (error) {
      console.error('Error generating notes:', error)
    }
  }

  const handleSetupComplete = () => {
    if (educationLevel && field) {
      setIsSetupComplete(true)
    }
  }

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-2xl font-bold text-center">Welcome to LectureMate</h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Education Level
              </label>
              <select 
                className="w-full p-2 border rounded-md"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">Select Level</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="phd">PhD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Field of Study
              </label>
              <select 
                className="w-full p-2 border rounded-md"
                value={field}
                onChange={(e) => setField(e.target.value)}
              >
                <option value="">Select Field</option>
                <option value="cs">Computer Science</option>
                <option value="engineering">Engineering</option>
                <option value="medicine">Medicine</option>
                <option value="business">Business</option>
              </select>
            </div>

            <button
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
              onClick={handleSetupComplete}
              disabled={!educationLevel || !field}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="flex justify-between items-center px-6 py-4 max-w-[1200px] mx-auto">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
              <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor"/>
            </svg>
            <span className="text-xl font-semibold">LectureMate</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L3 8L12 12L21 8L12 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 8V16L12 20L21 16V8" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="text-gray-600">{field} - {educationLevel}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Term Selector */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button 
              className={`px-6 py-2 rounded-lg text-sm font-medium ${
                currentTerm === 'first' ? 'bg-indigo-600 text-white' : 'text-gray-600'
              }`}
              onClick={() => setCurrentTerm('first')}
            >
              First Term
            </button>
            <button 
              className={`px-6 py-2 rounded-lg text-sm font-medium ${
                currentTerm === 'second' ? 'bg-indigo-600 text-white' : 'text-gray-600'
              }`}
              onClick={() => setCurrentTerm('second')}
            >
              Second Term
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[300px,1fr] gap-8">
          {/* Course List */}
          <div>
            <h2 className="text-gray-900 font-medium mb-4">Courses</h2>
            <div className="space-y-2">
              {courses.map(course => (
                <button
                  key={course.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    selectedCourse?.id === course.id 
                      ? 'bg-indigo-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
                  </svg>
                  <span className="text-gray-900">{course.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Course Content */}
          {selectedCourse && (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">{selectedCourse.name}</h1>
              
              {/* Transcript Input */}
              <div className="mb-8">
                <textarea
                  className="w-full h-32 p-4 rounded-lg border border-gray-200 resize-none"
                  placeholder="Enter your lecture transcript here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
                <button
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                  onClick={handleGenerateNotes}
                >
                  Generate Notes
                </button>
              </div>

              {/* Weekly Sections */}
              <div className="space-y-6">
                {selectedCourse.weeks.map(week => (
                  <div key={week.number} className="border-b border-gray-200 pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Week {week.number}</h3>
                        <p className="text-gray-600">{week.title}</p>
                      </div>
                      <button className="flex items-center space-x-2 text-indigo-600">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M4 16V17C4 18.7 5.3 20 7 20H17C18.7 20 20 18.7 20 17V16" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 4V16M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>Generate Notes First</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 