import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Listbox, Transition } from '@headlessui/react'
import { storage, metadata } from './firebase'
import { ref, getDownloadURL } from 'firebase/storage'

interface Course {
  id: string;
  name: string;
  weeks: Week[];
}

interface Week {
  number: number;
  title: string;
  topic?: string;
  summaries?: string[];
}

function App() {
  const [currentTerm, setCurrentTerm] = useState('first')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [educationLevel, setEducationLevel] = useState('')
  const [field, setField] = useState('')
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingLecture, setLoadingLecture] = useState<string | null>(null)

  const firstTermCourses = [
    {
      id: '7',
      name: 'Introduction to Computation',
      weeks: [
        {
          number: 1,
          title: '(Sep 16-20)',
          topic: 'Introduction and Functional Programming',
          summaries: [
            '2024-09-16_Informatics 1 - Introduction to Computation, Introductory Lecture.pdf',
            '2024-09-17_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-09-19_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-09-20_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 2,
          title: '(Sep 23-27)',
          topic: 'Computation and Logic',
          summaries: [
            '2024-09-23_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-09-24_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-09-26_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-09-27_Informatics 1 - Introduction to Computation, Functional Programming.pdf'
          ]
        },
        {
          number: 3,
          title: '(Sep 30-Oct 4)',
          topic: 'Functional Programming Basics',
          summaries: [
            '2024-09-30_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-01_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-03_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-10-04_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 4,
          title: '(Oct 8-11)',
          topic: 'Advanced Concepts',
          summaries: [
            '2024-10-08_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-10_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-10-11_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 5,
          title: '(Oct 14-18)',
          topic: 'Functional Programming Applications',
          summaries: [
            '2024-10-14_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-15_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-17_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-10-18_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 6,
          title: '(Oct 21-25)',
          topic: 'Advanced Logic',
          summaries: [
            '2024-10-21_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-22_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-24_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-10-25_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 7,
          title: '(Oct 28-Nov 1)',
          topic: 'Guest Lecture and Applications',
          summaries: [
            '2024-10-28_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-29_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-10-31_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-11-01_Informatics 1 - Introduction to Computation, John Hughes guest lecture.pdf'
          ]
        },
        {
          number: 8,
          title: '(Nov 4-8)',
          topic: 'Advanced Programming Concepts',
          summaries: [
            '2024-11-04_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-05_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-07_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-11-08_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 9,
          title: '(Nov 11-15)',
          topic: 'Complex Applications',
          summaries: [
            '2024-11-11_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-12_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-14_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-11-15_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        },
        {
          number: 10,
          title: '(Nov 25-29)',
          topic: 'Final Topics',
          summaries: [
            '2024-11-25_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-26_Informatics 1 - Introduction to Computation, Functional Programming.pdf',
            '2024-11-28_Informatics 1 - Introduction to Computation, Computation and Logic.pdf',
            '2024-11-29_Informatics 1 - Introduction to Computation, Computation and Logic.pdf'
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Introduction to Linear Algebra',
      weeks: [
        {
          number: 1,
          title: '(Sep 16-20)',
          topic: 'Vectors and Matrices',
          summaries: [
            '2024-09-16_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0640_00_G.0070_Monday 12_00.pdf',
            '2024-09-19_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-09-20_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 2,
          title: '(Sep 23-27)',
          topic: 'Linear Transformations',
          summaries: [
            '2024-09-26_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-09-27_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 3,
          title: '(Sep 30-Oct 4)',
          topic: 'Eigenvalues and Eigenvectors',
          summaries: [
            '2024-10-03_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-10-04_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 4,
          title: '(Oct 8-11)',
          topic: 'Vector Spaces',
          summaries: [
            '2024-10-10_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-10-11_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 5,
          title: '(Oct 14-18)',
          topic: 'Orthogonality',
          summaries: [
            '2024-10-17_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-10-18_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 6,
          title: '(Oct 21-25)',
          topic: 'Determinants',
          summaries: [
            '2024-10-24_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-10-25_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 7,
          title: '(Oct 28-Nov 1)',
          topic: 'Inner Product Spaces',
          summaries: [
            '2024-10-31_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-11-01_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 8,
          title: '(Nov 4-8)',
          topic: 'Diagonalization',
          summaries: [
            '2024-11-07_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-11-08_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 9,
          title: '(Nov 11-15)',
          topic: 'Singular Value Decomposition',
          summaries: [
            '2024-11-14_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-11-15_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        },
        {
          number: 10,
          title: '(Nov 18-22)',
          topic: 'Linear Programming',
          summaries: [
            '2024-11-21_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf'
          ]
        },
        {
          number: 11,
          title: '(Nov 25-29)',
          topic: 'Applications in Data Science',
          summaries: [
            '2024-11-28_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Thursday 12_00.pdf',
            '2024-11-29_MATH1 Introduction to Linear Algebra  Lecture_12_00_Lecture_0612_01_1.02_Friday 12_00.pdf'
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Data Science',
      weeks: [
        { number: 1, title: '(Sep 16-20)', topic: 'Data Collection and Cleaning', summaries: [] },
        { number: 2, title: '(Sep 23-27)', topic: 'Statistical Analysis', summaries: [] },
        { number: 3, title: '(Sep 30-Oct 4)', topic: 'Machine Learning Basics', summaries: [] },
        { number: 4, title: '(Oct 8-11)', topic: 'Exploratory Data Analysis', summaries: [] },
        { number: 5, title: '(Oct 14-18)', topic: 'Regression Models', summaries: [] },
        { number: 6, title: '(Oct 21-25)', topic: 'Classification Models', summaries: [] },
        { number: 7, title: '(Oct 28-Nov 1)', topic: 'Clustering and Dimensionality Reduction', summaries: [] },
        { number: 8, title: '(Nov 4-8)', topic: 'Time Series Analysis', summaries: [] },
        { number: 9, title: '(Nov 11-15)', topic: 'Deep Learning Introduction', summaries: [] },
        { number: 10, title: '(Nov 18-22)', topic: 'Natural Language Processing', summaries: [] },
        { number: 11, title: '(Nov 25-29)', topic: 'Big Data Processing', summaries: [] }
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
      name: 'Calculus and Its Applications',
      weeks: [
        {
          number: 1,
          title: '(Jan 13-16)',
          topic: 'Introduction to Calculus',
          summaries: [
            '2025-01-13_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf'
          ]
        },
        {
          number: 2,
          title: '(Jan 20-23)',
          topic: 'Limits and Continuity',
          summaries: [
            '2025-01-20_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-01-23_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        {
          number: 3,
          title: '(Jan 27-30)',
          topic: 'Derivatives',
          summaries: [
            '2025-01-27_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-01-30_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        {
          number: 4,
          title: '(Feb 3-6)',
          topic: 'Applications of Derivatives',
          summaries: [
            '2025-02-03_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
            '2025-02-06_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
          ]
        },
        {
          number: 5,
          title: '(Feb 10-13)',
          topic: 'Integration',
          summaries: [
            '2025-02-10_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf'
          ]
        },
        {
          number: 6,
          title: '(Feb 17-20)',
          topic: 'Integration Techniques',
          summaries: []
        },
        {
          number: 7,
          title: '(Feb 24-27)',
          topic: 'Applications of Integration',
          summaries: []
        },
        {
          number: 8,
          title: '(Mar 3-6)',
          topic: 'Differential Equations',
          summaries: []
        },
        {
          number: 9,
          title: '(Mar 10-13)',
          topic: 'Series and Sequences',
          summaries: []
        },
        {
          number: 10,
          title: '(Mar 17-20)',
          topic: 'Power Series',
          summaries: []
        },
        {
          number: 11,
          title: '(Mar 24-27)',
          topic: 'Applications in Science',
          summaries: []
        }
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

  const handleDownloadSummary = async (lecture: string, courseName: string) => {
    try {
      setLoadingLecture(lecture);
      setError(null);
      
      // Check if running on mobile Safari
      const isMobileSafari = /iPhone.*Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isMobileSafari) {
        const encodedLecture = encodeURIComponent(lecture);
        const encodedCourseName = encodeURIComponent(courseName);
        const proxyUrl = `https://lecturemate-ad674.web.app/proxy-pdf/${encodedCourseName}/${encodedLecture}`;
        
        console.log('Attempting to fetch PDF from:', proxyUrl);
        
        // First try to fetch the PDF to check if it's accessible
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/pdf'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('PDF fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            contentType: response.headers.get('content-type')
          });
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        
        // Check if we got a PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.error('Invalid content type:', contentType);
          throw new Error('Invalid response type from server');
        }
        
        // Create object URL for the PDF
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Open PDF in new tab
        window.open(pdfUrl, '_blank');
        
        // Clean up the object URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      } else {
        // For non-mobile Safari browsers, use direct Firebase Storage download
        const filePath = `transcriptions/${courseName}/summaries/pdf/${lecture}`;
        console.log('Attempting to download from Firebase Storage:', filePath);
        
        const fileRef = ref(storage, filePath);
        
        try {
          const downloadURL = await getDownloadURL(fileRef);
          console.log('Got download URL:', downloadURL);
          
          const response = await fetch(downloadURL, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/pdf',
              'Range': 'bytes=0-'
            }
          });
          
          if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            // If direct download fails, try opening in new tab
            window.open(downloadURL, '_blank');
            return;
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = lecture;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error with Firebase Storage:', error);
          setError('Failed to download the PDF. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download the PDF. Please try again later.');
    } finally {
      setLoadingLecture(null);
    }
  };

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
              '2025-02-03_Informatics 1 - Object Oriented Programming - Informatics Cohort Event_Lecture_0639_01_1.15_Monday 13_00.pdf'
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
    } else if (course.name === 'Calculus and Its Applications') {
      return {
        ...course,
        weeks: course.weeks.map(week => {
          const weekSummaries: string[] = [];
          if (week.number === 1) {
            weekSummaries.push(
              '2025-01-13_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf'
            );
          } else if (week.number === 2) {
            weekSummaries.push(
              '2025-01-20_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
              '2025-01-23_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
            );
          } else if (week.number === 3) {
            weekSummaries.push(
              '2025-01-27_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
              '2025-01-30_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
            );
          } else if (week.number === 4) {
            weekSummaries.push(
              '2025-02-03_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf',
              '2025-02-06_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Thursday 13_00.pdf'
            );
          } else if (week.number === 5) {
            weekSummaries.push(
              '2025-02-10_MATH1 Calculus and Its Appl - Lecture _Lecture_0639_01_1.14_Monday 13_00.pdf'
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

  const handleViewPDF = (lecture: string, courseName: string) => {
    // Use the same course mapping as handleDownloadSummary
    const courseMapping = {
      'Object Oriented Programming': 'Object Oriented Programming',
      'Calculus and Its Applications': 'Calculus and Its Applications',
      'Cognitive Science': 'Cognitive Science',
      'Introduction to Computation': 'Introduction to Computation',
      'Introduction to Linear Algebra': 'Introduction to Linear Algebra'
    };

    const coursePath = courseMapping[courseName];
    if (!coursePath) {
      console.error(`Unknown course: ${courseName}`);
      return;
    }

    const encodedLecture = encodeURIComponent(lecture);
    const encodedCoursePath = encodeURIComponent(coursePath);
    const pdfUrl = `http://localhost:3000/transcriptions/${encodedCoursePath}/summaries/pdf/${encodedLecture}`;
    window.open(pdfUrl, '_blank');
  };

  if (!isSetupComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full border border-indigo-50"
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="bg-indigo-600 p-3 rounded-xl"
              >
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
                  <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor"/>
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                LectureMate
              </h1>
          </div>
          </motion.div>
          
          <div className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Education Level
              </label>
              <Listbox value={educationLevel} onChange={setEducationLevel}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full py-3 pl-4 pr-10 text-left bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span className="block truncate">
                      {educationLevel ? educationLevel.charAt(0).toUpperCase() + educationLevel.slice(1) : "Select Level"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto bg-white rounded-xl max-h-60 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      {["Undergraduate", "Graduate", "PhD"].map((level) => (
                        <Listbox.Option
                          key={level.toLowerCase()}
                          className={({ active }) =>
                            `${active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'}
                            cursor-pointer select-none relative py-3 pl-4 pr-4 transition-colors duration-200`
                          }
                          value={level.toLowerCase()}
                        >
                          {({ selected, active }) => (
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                              {level}
                            </span>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
            </div>
              </Listbox>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Field of Study
              </label>
              <Listbox value={field} onChange={setField}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full py-3 pl-4 pr-10 text-left bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 shadow-sm">
                    <span className="block truncate">
                      {field ? field === 'cs' ? 'Computer Science' : 
                             field === 'engineering' ? 'Engineering' :
                             field === 'medicine' ? 'Medicine' :
                             'Business'
                      : "Select Field"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto bg-white rounded-xl max-h-60 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      {[
                        { id: 'cs', name: 'Computer Science' },
                        { id: 'engineering', name: 'Engineering' },
                        { id: 'medicine', name: 'Medicine' },
                        { id: 'business', name: 'Business' }
                      ].map((option) => (
                        <Listbox.Option
                          key={option.id}
                          className={({ active }) =>
                            `${active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'}
                            cursor-pointer select-none relative py-3 pl-4 pr-4 transition-colors duration-200`
                          }
                          value={option.id}
                        >
                          {({ selected, active }) => (
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                              {option.name}
                            </span>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
            </div>
              </Listbox>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                  !educationLevel || !field
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
                }`}
              onClick={handleSetupComplete}
              disabled={!educationLevel || !field}
            >
                Get Started
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 sm:px-6 py-4 max-w-[1200px] mx-auto gap-4">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
              <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="currentColor"/>
            </svg>
            <span className="text-xl font-semibold">LectureMate</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsSetupComplete(false);
              setSelectedCourse(null);
              setCurrentTerm('first');
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
          >
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L3 8L12 12L21 8L12 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 8V16L12 20L21 16V8" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="text-gray-600">
              {field === 'cs' ? 'Computer Science' : 
               field === 'engineering' ? 'Engineering' :
               field === 'medicine' ? 'Medicine' :
               field === 'business' ? 'Business' : ''} - {educationLevel ? educationLevel.charAt(0).toUpperCase() + educationLevel.slice(1) : ''}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Term Selector */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentTerm === 'first' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setCurrentTerm('first')}
            >
              First Term
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentTerm === 'second' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setCurrentTerm('second')}
            >
              Second Term
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">
          {/* Course List */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:block"
          >
            <h2 className="text-gray-900 font-medium mb-4">Courses</h2>
            <div className="space-y-2 flex flex-col">
              <AnimatePresence mode="wait">
                {courses.map(course => (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      selectedCourse?.id === course.id 
                        ? 'bg-indigo-50 shadow-md' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                      className="text-gray-400 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
                      </svg>
                    </motion.div>
                    <span className="text-gray-900 text-sm sm:text-base truncate">{course.name}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Course Content */}
          <AnimatePresence mode="wait">
            {selectedCourse && (
              <motion.div
                key={selectedCourse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="min-w-0"
              >
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6"
                >
                  {selectedCourse.name}
                </motion.h1>
                
                {/* Weekly Sections */}
                <div className="space-y-6">
                  <AnimatePresence>
                    {selectedCourse.weeks.map(week => (
                      <motion.div
                        key={week.number}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-gray-200 pb-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div>
                            <h3 className="font-medium">Week {week.number}</h3>
                            <p className="text-gray-600 text-sm">{week.title}</p>
                          </div>
                          {week.summaries && week.summaries.length > 0 ? (
                            <div className="flex flex-col space-y-2">
                              {week.summaries.map((summary, index) => (
                                <motion.button
                                  key={index}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleDownloadSummary(summary, selectedCourse.name)}
                                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                                  disabled={loadingLecture === summary}
                                >
                                  <motion.div
                                    whileHover={{ y: -2 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center"
                                  >
                                    {loadingLecture === summary ? (
                                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 4v12m0 0l-4-4m4 4l4-4m-5 8H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </motion.div>
                                  <span className={`text-sm sm:text-base ${loadingLecture === summary ? 'opacity-50' : ''}`}>
                                    {(() => {
                                      const datePart = summary.split('_')[0];
                                      const date = new Date(datePart);
                                      return date.toLocaleDateString('en-US', { weekday: 'long' });
                                    })()}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No summaries available</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-red-600 text-sm"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default App 