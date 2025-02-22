import React, { useState } from 'react'

interface Course {
  id: string;
  name: string;
  weeks: Week[];
}

interface Week {
  number: number;
  title: string;
  summaries?: string[];
}

function App() {
  const [currentTerm, setCurrentTerm] = useState('first')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [educationLevel, setEducationLevel] = useState('')
  const [field, setField] = useState('')
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstTermCourses = [
    {
      id: '1',
      name: 'Functional Programming',
      weeks: [
        { number: 1, title: 'Introduction to Lambda Calculus' },
        { number: 2, title: 'Higher Order Functions' },
        { number: 3, title: 'Recursion and Pattern Matching' },
        { number: 4, title: 'Type Systems' },
        { number: 5, title: 'Monads and Functors' },
        { number: 6, title: 'Lazy Evaluation' },
        { number: 7, title: 'Concurrent Programming' },
        { number: 8, title: 'Property Testing' },
        { number: 9, title: 'Parser Combinators' },
        { number: 10, title: 'Domain Specific Languages' },
        { number: 11, title: 'Advanced Applications' }
      ]
    },
    {
      id: '2',
      name: 'Introduction to Linear Algebra',
      weeks: [
        { number: 1, title: 'Vectors and Matrices' },
        { number: 2, title: 'Linear Transformations' },
        { number: 3, title: 'Eigenvalues and Eigenvectors' },
        { number: 4, title: 'Vector Spaces' },
        { number: 5, title: 'Orthogonality' },
        { number: 6, title: 'Determinants' },
        { number: 7, title: 'Inner Product Spaces' },
        { number: 8, title: 'Diagonalization' },
        { number: 9, title: 'Singular Value Decomposition' },
        { number: 10, title: 'Linear Programming' },
        { number: 11, title: 'Applications in Data Science' }
      ]
    },
    {
      id: '3',
      name: 'Data Science',
      weeks: [
        { number: 1, title: 'Data Collection and Cleaning' },
        { number: 2, title: 'Statistical Analysis' },
        { number: 3, title: 'Machine Learning Basics' },
        { number: 4, title: 'Exploratory Data Analysis' },
        { number: 5, title: 'Regression Models' },
        { number: 6, title: 'Classification Models' },
        { number: 7, title: 'Clustering and Dimensionality Reduction' },
        { number: 8, title: 'Time Series Analysis' },
        { number: 9, title: 'Deep Learning Introduction' },
        { number: 10, title: 'Natural Language Processing' },
        { number: 11, title: 'Big Data Processing' }
      ]
    }
  ]

  const secondTermCourses = [
    {
      id: '4',
      name: 'Object Oriented Programming',
      weeks: [
        { number: 1, title: '(Jan 13-16)' },
        { number: 2, title: '(Jan 20-23)' },
        { number: 3, title: '(Jan 27-30)' },
        { number: 4, title: '(Feb 3-6)' },
        { number: 5, title: '(Feb 10-13)' },
        { number: 6, title: '(Feb 17-20)' },
        { number: 7, title: '(Feb 24-27)' },
        { number: 8, title: '(Mar 3-6)' },
        { number: 9, title: '(Mar 10-13)' },
        { number: 10, title: '(Mar 17-20)' },
        { number: 11, title: '(Mar 24-27)' }
      ]
    },
    {
      id: '5',
      name: 'Calculus and its Applications',
      weeks: [
        { number: 1, title: '(Jan 13-16)' },
        { number: 2, title: '(Jan 20-23)' },
        { number: 3, title: '(Jan 27-30)' },
        { number: 4, title: '(Feb 3-6)' },
        { number: 5, title: '(Feb 10-13)' },
        { number: 6, title: '(Feb 17-20)' },
        { number: 7, title: '(Feb 24-27)' },
        { number: 8, title: '(Mar 3-6)' },
        { number: 9, title: '(Mar 10-13)' },
        { number: 10, title: '(Mar 17-20)' },
        { number: 11, title: '(Mar 24-27)' }
      ]
    },
    {
      id: '6',
      name: 'Cognitive Science',
      weeks: [
        {
          number: 1,
          title: '(Jan 14-17)',
          summaries: [
            '2025-01-14_Informatics 1 - Cognitive Science - Lecture 1_ Course Overview.pdf',
            '2025-01-16_Informatics 1 - Cognitive Science - Lecture 2_ Introduction to Cognitive Science.pdf',
            '2025-01-17_Informatics 1 - Cognitive Science - Lecture 3_ Introduction to Language.pdf'
          ]
        },
        {
          number: 2,
          title: '(Jan 21-23)',
          summaries: [
            '2025-01-21_Informatics 1 - Cognitive Science - Lecture 4_ Language Acquisition.pdf',
            '2025-01-23_Informatics 1 - Cognitive Science - Lecture 5_ The Perceptron.pdf'
          ]
        },
        {
          number: 3,
          title: '(Jan 28-31)',
          summaries: [
            '2025-01-28_Informatics 1 - Cognitive Science - Lecture 6_ Multilayer Perceptrons and Backpropagation.pdf',
            '2025-01-30_Informatics 1 - Cognitive Science - Lecture 7_ A Neural Network Model of the Past Tense.pdf',
            '2025-01-31_Informatics 1 - Cognitive Science - Lecture 8_ Word Segmentation.pdf'
          ]
        },
        {
          number: 4,
          title: '(Feb 4-7)',
          summaries: [
            '2025-02-04_Informatics 1 - Cognitive Science - Lecture 9_ Bayesian Modeling.pdf',
            '2025-02-06_Informatics 1 - Cognitive Science - Lecture 10_ Word Learning.pdf',
            '2025-02-07_Informatics 1 - Cognitive Science - Lecture 11_ Vector Semantics.pdf'
          ]
        },
        {
          number: 5,
          title: '(Feb 11-14)',
          summaries: [
            '2025-02-11_Informatics 1 - Cognitive Science - Lecture 12_ Categories.pdf',
            '2025-02-13_Informatics 1 - Cognitive Science - Lecture 13_ Judgement and Decision Making.pdf',
            '2025-02-14_Informatics 1 - Cognitive Science - Lecture 14_ Biases in Human Decision Making.pdf'
          ]
        },
        {
          number: 6,
          title: '(Feb 18-21)',
          summaries: []
        },
        {
          number: 7,
          title: '(Feb 25-28)',
          summaries: []
        },
        {
          number: 8,
          title: '(Mar 4-7)',
          summaries: []
        },
        {
          number: 9,
          title: '(Mar 11-14)',
          summaries: []
        },
        {
          number: 10,
          title: '(Mar 18-21)',
          summaries: []
        },
        {
          number: 11,
          title: '(Mar 24-27)',
          summaries: []
        }
      ]
    }
  ]

  const handleSetupComplete = () => {
    if (educationLevel && field) {
      setIsSetupComplete(true)
    }
  }

  const handleDownloadSummary = async (week: Week, courseName: string) => {
    try {
      if (!week.summaries || week.summaries.length === 0) {
        throw new Error('No summaries available for this week');
      }

      let basePath = '';
      if (courseName === 'Object Oriented Programming') {
        basePath = '/transcriptions/Object Oriented Programming/summaries/pdf/';
      } else if (courseName === 'Calculus and its Applications') {
        basePath = '/transcriptions/Calculus and Its Applications/summaries/pdf/';
      } else if (courseName === 'Cognitive Science') {
        basePath = '/transcriptions/Cognitive Science/summaries/pdf/';
      } else {
        throw new Error('Course not supported');
      }

      // Download each summary for the week
      for (const summary of week.summaries) {
        const response = await fetch(`${basePath}${summary}`);
        if (!response.ok) {
          console.error(`Failed to fetch summary: ${summary}`);
          continue;
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = summary;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading summary:', error);
      setError('Failed to download summary. Please try again.');
    }
  }

  const updatedSecondTermCourses = secondTermCourses.map(course => {
    if (course.name === 'Object Oriented Programming') {
      return {
        ...course,
        weeks: course.weeks.map(week => {
          // Match summaries based on week number
          const weekSummaries: string[] = [];
          if (week.number === 1) {
            weekSummaries.push(
              '2025-01-13_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Monday 12_00.pdf',
              '2025-01-16_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Thursday 12_00.pdf'
            );
          } else if (week.number === 2) {
            weekSummaries.push(
              '2025-01-20_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Monday 12_00.pdf',
              '2025-01-23_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Thursday 12_00.pdf'
            );
          } else if (week.number === 3) {
            weekSummaries.push(
              '2025-01-27_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Monday 12_00.pdf',
              '2025-01-30_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Thursday 12_00.pdf'
            );
          } else if (week.number === 4) {
            weekSummaries.push(
              '2025-02-03_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Monday 12_00.pdf',
              '2025-02-06_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Thursday 12_00.pdf'
            );
          } else if (week.number === 5) {
            weekSummaries.push(
              '2025-02-10_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Monday 12_00.pdf',
              '2025-02-13_Informatics 1 - Object Oriented Programming - Lecture_Lecture_0639_01_1.15_Thursday 12_00.pdf'
            );
          }
          return {
            ...week,
            summaries: weekSummaries
          };
        })
      };
    } else if (course.name === 'Calculus and its Applications') {
      return {
        ...course,
        weeks: course.weeks.map(week => {
          const weekSummaries: string[] = [];
          if (week.number <= 5) {
            const monday = new Date(2025, 0, 13 + (week.number - 1) * 7);
            const thursday = new Date(2025, 0, 16 + (week.number - 1) * 7);
            
            weekSummaries.push(
              `2025-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf`,
              `2025-${String(thursday.getMonth() + 1).padStart(2, '0')}-${String(thursday.getDate()).padStart(2, '0')}_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf`
            );
          }
          return {
            ...week,
            summaries: weekSummaries
          };
        })
      };
    } else if (course.name === 'Cognitive Science') {
      return {
        ...course,
        weeks: [
          {
            number: 1,
            title: '(Jan 14-17)',
            summaries: [
              '2025-01-14_Informatics 1 - Cognitive Science - Lecture 1_ Course Overview.pdf',
              '2025-01-16_Informatics 1 - Cognitive Science - Lecture 2_ Introduction to Cognitive Science.pdf',
              '2025-01-17_Informatics 1 - Cognitive Science - Lecture 3_ Introduction to Language.pdf'
            ]
          },
          {
            number: 2,
            title: '(Jan 21-23)',
            summaries: [
              '2025-01-21_Informatics 1 - Cognitive Science - Lecture 4_ Language Acquisition.pdf',
              '2025-01-23_Informatics 1 - Cognitive Science - Lecture 5_ The Perceptron.pdf'
            ]
          },
          {
            number: 3,
            title: '(Jan 28-31)',
            summaries: [
              '2025-01-28_Informatics 1 - Cognitive Science - Lecture 6_ Multilayer Perceptrons and Backpropagation.pdf',
              '2025-01-30_Informatics 1 - Cognitive Science - Lecture 7_ A Neural Network Model of the Past Tense.pdf',
              '2025-01-31_Informatics 1 - Cognitive Science - Lecture 8_ Word Segmentation.pdf'
            ]
          },
          {
            number: 4,
            title: '(Feb 4-7)',
            summaries: [
              '2025-02-04_Informatics 1 - Cognitive Science - Lecture 9_ Bayesian Modeling.pdf',
              '2025-02-06_Informatics 1 - Cognitive Science - Lecture 10_ Word Learning.pdf',
              '2025-02-07_Informatics 1 - Cognitive Science - Lecture 11_ Vector Semantics.pdf'
            ]
          },
          {
            number: 5,
            title: '(Feb 11-14)',
            summaries: [
              '2025-02-11_Informatics 1 - Cognitive Science - Lecture 12_ Categories.pdf',
              '2025-02-13_Informatics 1 - Cognitive Science - Lecture 13_ Judgement and Decision Making.pdf',
              '2025-02-14_Informatics 1 - Cognitive Science - Lecture 14_ Biases in Human Decision Making.pdf'
            ]
          },
          {
            number: 6,
            title: '(Feb 18-21)',
            summaries: []
          },
          {
            number: 7,
            title: '(Feb 25-28)',
            summaries: []
          },
          {
            number: 8,
            title: '(Mar 4-7)',
            summaries: []
          },
          {
            number: 9,
            title: '(Mar 11-14)',
            summaries: []
          },
          {
            number: 10,
            title: '(Mar 18-21)',
            summaries: []
          },
          {
            number: 11,
            title: '(Mar 24-27)',
            summaries: []
          }
        ]
      };
    }
    return course;
  });

  const courses = currentTerm === 'first' ? firstTermCourses : updatedSecondTermCourses;

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
                      {week.summaries && week.summaries.length > 0 ? (
                        <div className="flex flex-col space-y-2">
                          {week.summaries.map((summary, index) => (
                            <button
                              key={index}
                              onClick={() => handleDownloadSummary(week, selectedCourse.name)}
                              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <path d="M12 4v12m0 0l-4-4m4 4l4-4m-5 8H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>
                                {summary.includes('Monday') ? 'Monday Lecture' : 
                                 summary.includes('Thursday') ? 'Thursday Lecture' : 
                                 summary.match(/\d{4}-\d{2}-(\d{2})/) ? `${new Date(summary.split('_')[0]).toLocaleDateString('en-US', { weekday: 'long' })} Lecture` : 
                                 'Download Summary'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No summaries available</span>
                      )}
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