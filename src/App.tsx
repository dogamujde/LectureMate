import React, { useState, useEffect } from 'react'
import { NotesService } from './services/NotesService'
import { type Note } from './types'

interface Course {
  id: string;
  name: string;
  weeks: Week[];
}

interface Week {
  number: number;
  title: string;
  isGenerated: boolean;
  notes?: Note;
  pdfPath?: string;
  lectures?: string[];
}

function App() {
  const [currentTerm, setCurrentTerm] = useState('first')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [educationLevel, setEducationLevel] = useState('')
  const [field, setField] = useState('')
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([])

  const firstTermCourses = [
    {
      id: '1',
      name: 'Functional Programming',
      weeks: [
        { number: 1, title: 'Introduction to Lambda Calculus', isGenerated: false },
        { number: 2, title: 'Higher Order Functions', isGenerated: false },
        { number: 3, title: 'Recursion and Pattern Matching', isGenerated: false },
        { number: 4, title: 'Type Systems', isGenerated: false },
        { number: 5, title: 'Monads and Functors', isGenerated: false },
        { number: 6, title: 'Lazy Evaluation', isGenerated: false },
        { number: 7, title: 'Concurrent Programming', isGenerated: false },
        { number: 8, title: 'Property Testing', isGenerated: false },
        { number: 9, title: 'Parser Combinators', isGenerated: false },
        { number: 10, title: 'Domain Specific Languages', isGenerated: false },
        { number: 11, title: 'Advanced Applications', isGenerated: false }
      ]
    },
    {
      id: '2',
      name: 'Introduction to Linear Algebra',
      weeks: [
        { number: 1, title: 'Vectors and Matrices', isGenerated: false },
        { number: 2, title: 'Linear Transformations', isGenerated: false },
        { number: 3, title: 'Eigenvalues and Eigenvectors', isGenerated: false },
        { number: 4, title: 'Vector Spaces', isGenerated: false },
        { number: 5, title: 'Orthogonality', isGenerated: false },
        { number: 6, title: 'Determinants', isGenerated: false },
        { number: 7, title: 'Inner Product Spaces', isGenerated: false },
        { number: 8, title: 'Diagonalization', isGenerated: false },
        { number: 9, title: 'Singular Value Decomposition', isGenerated: false },
        { number: 10, title: 'Linear Programming', isGenerated: false },
        { number: 11, title: 'Applications in Data Science', isGenerated: false }
      ]
    },
    {
      id: '3',
      name: 'Data Science',
      weeks: [
        { number: 1, title: 'Data Collection and Cleaning', isGenerated: false },
        { number: 2, title: 'Statistical Analysis', isGenerated: false },
        { number: 3, title: 'Machine Learning Basics', isGenerated: false },
        { number: 4, title: 'Exploratory Data Analysis', isGenerated: false },
        { number: 5, title: 'Regression Models', isGenerated: false },
        { number: 6, title: 'Classification Models', isGenerated: false },
        { number: 7, title: 'Clustering and Dimensionality Reduction', isGenerated: false },
        { number: 8, title: 'Time Series Analysis', isGenerated: false },
        { number: 9, title: 'Deep Learning Introduction', isGenerated: false },
        { number: 10, title: 'Natural Language Processing', isGenerated: false },
        { number: 11, title: 'Big Data Processing', isGenerated: false }
      ]
    }
  ]

  const secondTermCourses = [
    {
      id: '4',
      name: 'Object Oriented Programming',
      weeks: [
        { 
          number: 1, 
          title: 'Classes and Objects', 
          isGenerated: false,
          lectures: [
            '2025-01-13_OOP Classes and Objects_Lecture_Monday 13_00.pdf',
            '2025-01-16_OOP Classes and Objects_Lecture_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 2, 
          title: 'Inheritance and Polymorphism', 
          isGenerated: false,
          lectures: [
            '2025-01-20_OOP Inheritance and Polymorphism_Lecture_Monday 13_00.pdf',
            '2025-01-23_OOP Inheritance and Polymorphism_Lecture_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 3, 
          title: 'Design Patterns', 
          isGenerated: false,
          lectures: [
            '2025-01-27_OOP Design Patterns_Lecture_Monday 13_00.pdf',
            '2025-01-30_OOP Design Patterns_Lecture_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 4, 
          title: 'SOLID Principles', 
          isGenerated: false,
          lectures: [
            '2025-02-03_OOP SOLID Principles_Lecture_Monday 13_00.pdf',
            '2025-02-06_OOP SOLID Principles_Lecture_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 5, 
          title: 'Exception Handling', 
          isGenerated: false,
          lectures: [
            '2025-02-10_OOP Exception Handling_Lecture_Monday 13_00.pdf',
            '2025-02-13_OOP Exception Handling_Lecture_Thursday 13_00.pdf'
          ]
        },
        { number: 6, title: 'Unit Testing', isGenerated: false },
        { number: 7, title: 'Dependency Injection', isGenerated: false },
        { number: 8, title: 'Concurrency in OOP', isGenerated: false },
        { number: 9, title: 'Design by Contract', isGenerated: false },
        { number: 10, title: 'Refactoring Techniques', isGenerated: false },
        { number: 11, title: 'Advanced OOP Concepts', isGenerated: false }
      ]
    },
    {
      id: '5',
      name: 'Calculus and its Applications',
      weeks: [
        { 
          number: 1, 
          title: 'Week 1 (Jan 13-16)', 
          isGenerated: false,
          lectures: [
            '2025-01-13_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-01-16_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 2, 
          title: 'Week 2 (Jan 20-23)', 
          isGenerated: false,
          lectures: [
            '2025-01-20_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-01-23_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 3, 
          title: 'Week 3 (Jan 27-30)', 
          isGenerated: false,
          lectures: [
            '2025-01-27_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-01-30_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 4, 
          title: 'Week 4 (Feb 3-6)', 
          isGenerated: false,
          lectures: [
            '2025-02-03_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-02-06_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        { 
          number: 5, 
          title: 'Week 5 (Feb 10-13)', 
          isGenerated: false,
          lectures: [
            '2025-02-10_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-02-13_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        { number: 6, title: 'Week 6', isGenerated: false },
        { number: 7, title: 'Week 7', isGenerated: false },
        { number: 8, title: 'Week 8', isGenerated: false },
        { number: 9, title: 'Week 9', isGenerated: false },
        { number: 10, title: 'Week 10', isGenerated: false },
        { number: 11, title: 'Week 11', isGenerated: false }
      ]
    },
    {
      id: '6',
      name: 'Cognitive Science',
      weeks: [
        { 
          number: 1, 
          title: 'Introduction to Cognitive Science', 
          isGenerated: false,
          lectures: [
            '2025-01-13_COGSCI Introduction to Cognitive Science_Lecture_Monday 13_00.pdf',
            '2025-01-16_COGSCI Introduction to Cognitive Science_Lecture_Thursday 13_00.pdf',
            '2025-01-17_COGSCI Introduction to Cognitive Science_Lecture_Friday 13_00.pdf'
          ]
        },
        { 
          number: 2, 
          title: 'Perception and Attention', 
          isGenerated: false,
          lectures: [
            '2025-01-20_COGSCI Perception and Attention_Lecture_Monday 13_00.pdf',
            '2025-01-23_COGSCI Perception and Attention_Lecture_Thursday 13_00.pdf',
            '2025-01-24_COGSCI Perception and Attention_Lecture_Friday 13_00.pdf'
          ]
        },
        { 
          number: 3, 
          title: 'Memory and Learning', 
          isGenerated: false,
          lectures: [
            '2025-01-27_COGSCI Memory and Learning_Lecture_Monday 13_00.pdf',
            '2025-01-30_COGSCI Memory and Learning_Lecture_Thursday 13_00.pdf',
            '2025-01-31_COGSCI Memory and Learning_Lecture_Friday 13_00.pdf'
          ]
        },
        { 
          number: 4, 
          title: 'Language Processing', 
          isGenerated: false,
          lectures: [
            '2025-02-03_COGSCI Language Processing_Lecture_Monday 13_00.pdf',
            '2025-02-06_COGSCI Language Processing_Lecture_Thursday 13_00.pdf',
            '2025-02-07_COGSCI Language Processing_Lecture_Friday 13_00.pdf'
          ]
        },
        { 
          number: 5, 
          title: 'Problem Solving', 
          isGenerated: false,
          lectures: [
            '2025-02-10_COGSCI Problem Solving_Lecture_Monday 13_00.pdf',
            '2025-02-13_COGSCI Problem Solving_Lecture_Thursday 13_00.pdf',
            '2025-02-14_COGSCI Problem Solving_Lecture_Friday 13_00.pdf'
          ]
        },
        { number: 6, title: 'Decision Making', isGenerated: false },
        { number: 7, title: 'Cognitive Development', isGenerated: false },
        { number: 8, title: 'Social Cognition', isGenerated: false },
        { number: 9, title: 'Cognitive Neuroscience', isGenerated: false },
        { number: 10, title: 'Artificial Intelligence', isGenerated: false },
        { number: 11, title: 'Future of Cognitive Science', isGenerated: false }
      ]
    }
  ]

  const courses = currentTerm === 'first' ? firstTermCourses : secondTermCourses

  const handleGenerateNotes = async (weekNumber: number) => {
    setIsGenerating(true)
    setError(null)
    setCurrentWeek(weekNumber)
    try {
      const result = await NotesService.generateNotes(selectedCourse?.weeks[weekNumber - 1].notes?.content || '')
      
      if (selectedCourse) {
        const updatedCourse = {
          ...selectedCourse,
          weeks: selectedCourse.weeks.map(week => ({
            ...week,
            isGenerated: week.number === weekNumber ? true : week.isGenerated,
            notes: week.number === weekNumber ? result : week.notes
          }))
        }
        setSelectedCourse(updatedCourse)
      }
    } catch (error) {
      console.error('Error generating notes:', error)
      setError('Failed to generate notes. Please try again.')
    } finally {
      setIsGenerating(false)
      setCurrentWeek(null)
    }
  }

  const handleDownloadNotes = async (week: Week) => {
    if (week.lectures && week.lectures.length > 0 && selectedCourse) {
      try {
        const coursePath = selectedCourse.name === 'Calculus and its Applications' ? 'calculus' : 
                          selectedCourse.name === 'Object Oriented Programming' ? 'oop' : 'cognitive science';
        // Download each lecture PDF in the week
        week.lectures.forEach(async (lecture) => {
          const response = await fetch(`/transcriptions/${coursePath}/summaries/pdf/${lecture}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = lecture;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      } catch (error) {
        console.error('Error downloading PDFs:', error);
        setError('Failed to download PDFs. Please try again.');
      }
    } else if (week.notes) {
      try {
        const blob = await NotesService.generatePDF(
          week.notes.content,
          selectedCourse?.name || 'Lecture',
          week.title
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCourse?.name} - ${week.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        setError('Failed to download PDF. Please try again.');
      }
    }
  }

  const handleViewNotes = async (week: Week) => {
    if (expandedWeeks.includes(week.number)) {
      setExpandedWeeks(expandedWeeks.filter(num => num !== week.number))
    } else {
      setExpandedWeeks([...expandedWeeks, week.number])
    }
  }

  const handleDownloadLecture = async (lecture: string, courseName: string) => {
    try {
      const coursePath = courseName === 'Calculus and its Applications' ? 'calculus' : 
                        courseName === 'Object Oriented Programming' ? 'oop' : 'cognitive science';
      const response = await fetch(`/transcriptions/${coursePath}/summaries/pdf/${lecture}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lecture;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF. Please try again.');
    }
  }

  const handleViewPDF = (lecture: string, courseName: string) => {
    const coursePath = courseName === 'Calculus and its Applications' ? 'calculus' : 
                      courseName === 'Object Oriented Programming' ? 'oop' : 'cognitive science';
    const encodedLecture = encodeURIComponent(lecture);
    const encodedCoursePath = encodeURIComponent(coursePath);
    const pdfUrl = `http://localhost:5173/transcriptions/${encodedCoursePath}/summaries/pdf/${encodedLecture}`;
    window.open(pdfUrl, '_blank');
  };

  useEffect(() => {
    // Check for available PDFs when a course is selected
    if (selectedCourse) {
      const updatedCourse = {
        ...selectedCourse,
        weeks: selectedCourse.weeks.map(week => {
          // For Calculus, Cognitive Science, and OOP courses, if the week has lectures, mark it as available
          if ((selectedCourse.name === 'Calculus and its Applications' || 
               selectedCourse.name === 'Cognitive Science' ||
               selectedCourse.name === 'Object Oriented Programming') 
              && week.lectures && week.lectures.length > 0) {
            return {
              ...week,
              pdfPath: 'available'
            };
          }
          // For other courses, keep the existing logic
          return week;
        })
      };
      setSelectedCourse(updatedCourse);
    }
  }, [selectedCourse?.id]); // Only run when the course ID changes

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
              
              {/* Weekly Sections */}
              <div className="space-y-6">
                {selectedCourse.weeks.map(week => (
                  <div key={week.number} className="border-b border-gray-200 pb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Week {week.number}</h3>
                        <p className="text-gray-600">{week.title}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        {(week.pdfPath || (week.lectures && week.lectures.length > 0)) ? (
                          <button
                            onClick={() => handleViewNotes(week)}
                            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                              {expandedWeeks.includes(week.number) ? (
                                <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              ) : (
                                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              )}
                            </svg>
                            <span>View Notes</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No notes available</span>
                        )}
                      </div>
                    </div>
                    {/* Expanded lecture list */}
                    <div className={`mt-4 pl-4 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedWeeks.includes(week.number) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {week.lectures?.map((lecture, index) => (
                        <div 
                          key={index} 
                          className="space-y-2"
                        >
                          <div className={`flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg transform transition-transform duration-300 ease-in-out ${
                            expandedWeeks.includes(week.number) ? 'translate-y-0' : 'translate-y-4'
                          }`}>
                            <span className="text-sm text-gray-600">
                              {lecture.split('_')[0]} - {lecture.includes('Monday') ? 'Monday' : lecture.includes('Thursday') ? 'Thursday' : 'Friday'} Lecture
                            </span>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleViewPDF(lecture, selectedCourse.name)}
                                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 text-sm"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>View PDF</span>
                              </button>
                              <button
                                onClick={() => handleDownloadLecture(lecture, selectedCourse.name)}
                                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 text-sm"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 4v12m0 0l-4-4m4 4l4-4m-5 8H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {error && (
                <p className="mt-4 text-red-600 text-sm">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 