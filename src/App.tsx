import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Sparkles, Download, Mail, Clock, CheckCircle, FileAudio, Zap, Star, ArrowRight, Play, Shield, Users, Bot, Plus, BarChart3, Crown } from 'lucide-react';
import { SignedIn, UserButton, useAuth, useClerk } from '@clerk/clerk-react';
import { analyzeMeetingWithHF } from './huggingfaceService';

interface MeetingResults {
  summary: string;
  actionPoints: Array<{
    task: string;
    person: string;
    deadline: string;
  }>;
  decisions: string[];
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'app' | 'pricing'>('landing');
  const [currentStep, setCurrentStep] = useState<'form' | 'loading' | 'results'>('form');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [results, setResults] = useState<MeetingResults | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(false);

  const goToApp = () => setCurrentPage('app');
  const goToLanding = () => setCurrentPage('landing');
  const goToPricing = () => setCurrentPage('pricing');

  useEffect(() => {
    if (isSignedIn && redirectAfterAuth) {
      setCurrentPage('app');
      setRedirectAfterAuth(false);
    }
  }, [isSignedIn, redirectAfterAuth]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleGenerateSummary = useCallback(async () => {
    if (!transcript.trim()) {
      alert('Please enter a meeting transcript first');
      return;
    }

    setCurrentStep('loading');
    
    try {
      const analysis = await analyzeMeetingWithHF(transcript);
      setResults(analysis);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error analyzing meeting:', error);
      alert('Failed to analyze meeting. Please check your Hugging Face token and try again.');
      setCurrentStep('form');
    }
  }, [transcript]);

  const handleDownloadPDF = () => {
    if (!results) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meeting Summary - ${new Date().toLocaleDateString()}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3B82F6;
              margin-bottom: 10px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #E5E7EB;
            }
            .summary {
              background: #F8FAFC;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #3B82F6;
            }
            .action-item {
              background: #F0FDF4;
              padding: 15px;
              margin-bottom: 10px;
              border-radius: 6px;
              border-left: 4px solid #10B981;
            }
            .decision-item {
              background: #FEF3C7;
              padding: 15px;
              margin-bottom: 10px;
              border-radius: 6px;
              border-left: 4px solid #F59E0B;
            }
            .task {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .meta {
              font-size: 14px;
              color: #6B7280;
            }
            .meta strong {
              color: #374151;
            }
            @media print {
              body { margin: 0; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">📝 Meetly.ai</div>
            <div class="date">Meeting Summary - ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          
          <div class="section">
            <div class="section-title">📌 Meeting Summary</div>
            <div class="summary">${results.summary}</div>
          </div>
          
          <div class="section">
            <div class="section-title">✅ Action Points</div>
            ${results.actionPoints.map(action => `
              <div class="action-item">
                <div class="task">${action.task}</div>
                <div class="meta">
                  <strong>Assigned to:</strong> ${action.person}<br>
                  <strong>Due:</strong> ${action.deadline}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">⏰ Decisions</div>
            ${results.decisions.map(decision => `
              <div class="decision-item">${decision}</div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleEmailTeam = () => {
    alert('Email functionality would be implemented here');
  };

  const resetForm = () => {
    setCurrentStep('form');
    setUploadedFile(null);
    setTranscript('');
    setResults(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Minimal brand logo (SVG mark)
  const BrandLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="App logo"
      role="img"
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#grad)" />
      <path
        d="M18 34c6-1 10-5 14-12 4 7 8 11 14 12-5 2-9 5-14 12-5-7-9-10-14-12z"
        fill="#ffffff"
        opacity="0.95"
        filter="url(#glow)"
      />
    </svg>
  );

  // Enhanced Landing Page Component
  const LandingPage = () => (
    <div className={`min-h-screen relative transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-white via-pink-100 to-rose-100 text-gray-900'
    }`}>
      <div className="relative">


        {/* Clean Header */}
        <motion.header
          className={`flex justify-between items-center p-6 max-w-7xl mx-auto border-b transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <BrandLogo size={36} />
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Meetly.ai</span>
          </motion.div>

          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </motion.button>

            {/* Pro Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ 
                scale: 0.95,
                boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
              }}
              onClick={goToPricing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileTap={{ x: "100%" }}
                transition={{ duration: 0.3 }}
              />
              <Crown className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Pro</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToApp}
              className={`font-semibold px-6 py-3 rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-white text-gray-900 hover:bg-gray-100' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Get Started
            </motion.button>
          </div>
        </motion.header>

        {/* Floating Glass Objects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {/* Large Document/Notes Glass */}
          <motion.div
            className="absolute top-32 right-20 w-28 h-36 bg-purple-500/40 backdrop-blur-xl rounded-xl border-4 border-purple-400/60 shadow-2xl"
            animate={{
              y: [0, 15, 0],
              rotate: [0, 3, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <div className="p-4">
              <div className="w-full h-3 bg-purple-300/80 rounded mb-2"></div>
              <div className="w-4/5 h-2 bg-purple-200 rounded mb-2"></div>
              <div className="w-3/4 h-2 bg-purple-200 rounded mb-2"></div>
              <div className="w-5/6 h-2 bg-purple-200 rounded mb-2"></div>
              <div className="w-2/3 h-2 bg-purple-200 rounded"></div>
            </div>
          </motion.div>
        </div>

              {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
                          {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-8 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>AI-Powered Meeting Intelligence</span>
              </motion.div>

                          {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
              >
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Transform Your
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Meeting Notes
                </span>
              </motion.h1>

                          {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className={`text-xl mb-12 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Automatically generate summaries, extract action items, and track decisions from your meeting recordings and transcripts.
              </motion.p>

                          {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ 
                    scale: 0.95,
                    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
                  }}
                  onClick={() => {
                    if (isSignedIn) {
                      goToApp();
                    } else {
                      setRedirectAfterAuth(true);
                      openSignIn({
                        afterSignInUrl: window.location.href,
                        afterSignUpUrl: window.location.href,
                        appearance: { variables: { colorPrimary: '#3B82F6' } }
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileTap={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <Play className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Start Free Trial</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ 
                    scale: 0.95,
                    boxShadow: "0 0 0 4px rgba(156, 163, 175, 0.3)"
                  }}
                  className={`font-semibold px-8 py-4 rounded-lg border transition-all duration-300 flex items-center space-x-2 relative overflow-hidden group ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' 
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <motion.div
                    className={`absolute inset-0 ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-100/50'
                    }`}
                    initial={{ x: "-100%" }}
                    whileTap={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <ArrowRight className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Watch Demo</span>
                </motion.button>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20"
              >
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    description: "Process hours of meetings in minutes with our advanced AI"
                  },
                  {
                    icon: Shield,
                    title: "Secure & Private",
                    description: "Your data stays private with enterprise-grade security"
                  },
                  {
                    icon: Star,
                    title: "AI Powered",
                    description: "Advanced machine learning for accurate insights"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className={`text-center p-6 rounded-xl transition-all duration-300 hover:shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700' 
                        : 'bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200/50'
                    }`}
                  >
                    <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</h3>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
          </motion.div>
        </div>
        {/* Decorative Divider */}
        <div className="py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
            transition={{ duration: 6, repeat: Infinity }}
            className={`mx-auto max-w-6xl h-[3px] rounded-full ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
            }`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #60A5FA, #8B5CF6, #EC4899)',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className={`py-20 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-pink-100/50 to-rose-100/50'
          }`}
        >
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className={`text-5xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>See It In Action</h2>
                <p className={`max-w-4xl mx-auto transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Watch how Meetly.ai transforms your meeting workflow
                </p>
              </div>
              
             
              <motion.div 
                className={`rounded-2xl shadow-xl border overflow-hidden transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white/90 backdrop-blur-sm border-gray-200/50'
                }`}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className={`px-6 py-4 border-b transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100/80 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 bg-red-500 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-3 h-3 bg-yellow-500 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div 
                      className="w-3 h-3 bg-green-500 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                    <motion.span 
                      className={`text-sm ml-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Meetly.ai Dashboard
                    </motion.span>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <motion.div 
                      className="lg:col-span-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.8, duration: 0.8 }}
                    >
                      <motion.div 
                        className={`rounded-lg p-6 transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800' : 'bg-gray-50/80'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div 
                          className="flex items-center space-x-3 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2, duration: 0.5 }}
                        >
                          <motion.div 
                            className="bg-blue-600 p-2 rounded-lg"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Bot className="w-5 h-5 text-white" />
                          </motion.div>
                          <span className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Meetly.ai</span>
                        </motion.div>
                        
                        <motion.button 
                          className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg mb-4 flex items-center space-x-3"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2.2, duration: 0.5 }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>New Meeting</span>
                        </motion.button>
                        
                        <nav className="space-y-2">
                          {[
                            { icon: BarChart3, label: "Dashboard", active: true },
                            { icon: Users, label: "Meetings" },
                            { icon: FileText, label: "Transcripts" },
                            { icon: CheckCircle, label: "Action Items" }
                          ].map((item, index) => (
                            <motion.button
                              key={item.label}
                              className={`w-full py-3 px-4 rounded-lg text-left flex items-center space-x-3 transition-colors ${
                                item.active
                                  ? 'bg-blue-100 text-blue-700'
                                  : isDarkMode 
                                    ? 'text-gray-300 hover:bg-gray-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 2.4 + index * 0.1, duration: 0.5 }}
                              whileHover={{ x: 5 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="font-medium">{item.label}</span>
                            </motion.button>
                          ))}
                        </nav>
                      </motion.div>
                    </motion.div>
                    
                    {/* Main Content */}
                    <motion.div 
                      className="lg:col-span-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2, duration: 0.8 }}
                    >
                      <div className="space-y-6">
                        <motion.div 
                          className="flex justify-between items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2.2, duration: 0.5 }}
                        >
                          <h3 className={`text-xl font-bold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Recent Meetings</h3>
                          <motion.select 
                            className={`px-4 py-2 rounded-lg text-sm border transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-gray-800 text-white border-gray-600' 
                                : 'bg-white text-gray-900 border-gray-300'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                          </motion.select>
                        </motion.div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { title: "Q4 Planning", duration: "45 min", participants: 8, status: "Completed" },
                            { title: "Product Review", duration: "32 min", participants: 5, status: "In Progress" },
                            { title: "Team Sync", duration: "28 min", participants: 12, status: "Completed" },
                            { title: "Client Meeting", duration: "60 min", participants: 3, status: "Scheduled" }
                          ].map((meeting, index) => (
                            <motion.div 
                              key={index} 
                              className={`border rounded-lg p-6 hover:shadow-md transition-all duration-300 ${
                                isDarkMode 
                                  ? 'bg-gray-800 border-gray-700' 
                                  : 'bg-white/80 backdrop-blur-sm border-gray-200/50'
                              }`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 2.4 + index * 0.1, duration: 0.5 }}
                              whileHover={{ 
                                y: -5,
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                              }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h4 className={`font-semibold transition-colors duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{meeting.title}</h4>
                                <motion.span 
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    meeting.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    meeting.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}
                                  animate={{ 
                                    scale: [1, 1.1, 1],
                                    opacity: [0.8, 1, 0.8]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    delay: index * 0.5 
                                  }}
                                >
                                  {meeting.status}
                                </motion.span>
                              </div>
                              <div className={`flex items-center space-x-4 text-sm transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{meeting.duration}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{meeting.participants} people</span>
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className={`py-20 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.2, duration: 0.6 }}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Trusted by 10,000+ Teams</span>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.4, duration: 0.8 }}
                  className={`text-4xl font-bold mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  What Our Users Say
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.8 }}
                  className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Join thousands of teams who have transformed their meeting workflow with Meetly.ai
                </motion.p>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    name: "Sarah Chen",
                    role: "Product Manager",
                    company: "TechFlow Inc.",
                    rating: 5,
                    review: "Meetly.ai has completely transformed how we handle our weekly standups. The automatic action item extraction is a game-changer!",
                    avatar: "SC"
                  },
                  {
                    name: "Marcus Rodriguez",
                    role: "Engineering Lead",
                    company: "InnovateCorp",
                    rating: 5,
                    review: "The accuracy of the transcriptions is incredible. It's like having a perfect assistant in every meeting. Highly recommended!",
                    avatar: "MR"
                  },
                  {
                    name: "Emily Watson",
                    role: "Marketing Director",
                    company: "GrowthLabs",
                    rating: 5,
                    review: "Finally, a tool that actually understands what's important in meetings. The summaries are spot-on every time.",
                    avatar: "EW"
                  },
                  {
                    name: "David Kim",
                    role: "CEO",
                    company: "StartupXYZ",
                    rating: 5,
                    review: "This tool has saved us hours of manual note-taking. The ROI is immediate and the insights are invaluable.",
                    avatar: "DK"
                  },
                  {
                    name: "Lisa Thompson",
                    role: "HR Manager",
                    company: "PeopleFirst",
                    rating: 5,
                    review: "Perfect for our remote team. Everyone stays on the same page with the automated meeting summaries.",
                    avatar: "LT"
                  },
                  {
                    name: "Alex Johnson",
                    role: "Sales Director",
                    company: "RevenueMax",
                    rating: 5,
                    review: "The action item tracking feature alone is worth the subscription. Never miss a follow-up again!",
                    avatar: "AJ"
                  }
                ].map((review, index) => (
                  <motion.div
                    key={review.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.8 + index * 0.1, duration: 0.8 }}
                    whileHover={{ y: -5 }}
                    className={`p-8 rounded-2xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    {/* Review Text */}
                    <p className={`text-lg mb-6 leading-relaxed transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      "{review.review}"
                    </p>
                    
                    {/* Author */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}>
                        {review.avatar}
                      </div>
                      <div>
                        <h4 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{review.name}</h4>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>{review.role} at {review.company}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5, duration: 0.8 }}
                className={`rounded-2xl p-8 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  {[
                    { number: "10,000+", label: "Active Teams" },
                    { number: "50,000+", label: "Meetings Processed" },
                    { number: "4.9/5", label: "Average Rating" },
                    { number: "98%", label: "Customer Satisfaction" }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stat.number}
                      </div>
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* API Integration Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.8, duration: 1 }}
          className={`py-20 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50/50 to-purple-50/50'
          }`}
        >
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 4, duration: 0.6 }}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Pro Features</span>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.2, duration: 0.8 }}
                  className={`text-4xl font-bold mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Seamless API Integrations
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.4, duration: 0.8 }}
                  className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Connect directly to your favorite meeting platforms and automate your workflow with our Pro subscription
                </motion.p>
              </div>

              {/* Integration Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    name: "Zoom",
                    description: "Direct integration with Zoom meetings and recordings",
                    features: ["Auto-record meetings", "Real-time transcription", "Cloud storage sync"],
                    icon: "🎥",
                    color: "blue"
                  },
                  {
                    name: "Google Meet",
                    description: "Seamless Google Meet integration for instant processing",
                    features: ["Live captions", "Meeting analytics", "Calendar sync"],
                    icon: "📹",
                    color: "green"
                  },
                  {
                    name: "Microsoft Teams",
                    description: "Enterprise-grade Teams integration with advanced features",
                    features: ["Channel integration", "Meeting insights", "Team collaboration"],
                    icon: "💼",
                    color: "purple"
                  },
                  {
                    name: "Slack",
                    description: "Share meeting summaries directly to Slack channels",
                    features: ["Channel posting", "Thread integration", "Bot commands"],
                    icon: "💬",
                    color: "yellow"
                  },
                  {
                    name: "Notion",
                    description: "Export meeting notes to Notion databases automatically",
                    features: ["Database sync", "Template creation", "Page generation"],
                    icon: "📝",
                    color: "gray"
                  },
                  {
                    name: "Custom API",
                    description: "Build custom integrations with our developer API",
                    features: ["REST API access", "Webhook support", "SDK documentation"],
                    icon: "🔧",
                    color: "indigo"
                  }
                ].map((integration, index) => (
                  <motion.div
                    key={integration.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4.6 + index * 0.1, duration: 0.8 }}
                    whileHover={{ y: -5 }}
                    className={`p-8 rounded-2xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <div className="text-4xl mb-4">{integration.icon}</div>
                    <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{integration.name}</h3>
                    <p className={`mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{integration.description}</p>
                    <ul className="space-y-2">
                      {integration.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              {/* Pro Subscription CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 5.2, duration: 0.8 }}
                className={`rounded-2xl p-12 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                }`}
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
                <h3 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Upgrade to Pro</h3>
                <p className={`text-xl mb-8 max-w-2xl mx-auto transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Get unlimited API integrations, advanced analytics, and priority support for your team
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ 
                      scale: 0.95,
                      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      whileTap={{ x: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                    <Crown className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Start Pro Trial</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ 
                      scale: 0.95,
                      boxShadow: "0 0 0 4px rgba(156, 163, 175, 0.3)"
                    }}
                    onClick={goToPricing}
                    className={`font-semibold px-8 py-4 rounded-lg border transition-all duration-300 flex items-center space-x-2 relative overflow-hidden group ${
                      isDarkMode 
                        ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' 
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <motion.div
                      className={`absolute inset-0 ${
                        isDarkMode ? 'bg-white/10' : 'bg-gray-100/50'
                      }`}
                      initial={{ x: "-100%" }}
                      whileTap={{ x: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                    <FileText className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">View Pricing</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Main App Component
  const MainApp = () => (
    <div className={`min-h-screen relative transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-white via-pink-100 to-rose-100 text-gray-900'
    }`}>
      {/* Navigation for main app */}
      <motion.nav
        className={`flex justify-between items-center p-6 relative z-20 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.button
          onClick={goToLanding}
          className={`flex items-center space-x-3 transition-colors ${
            isDarkMode ? 'text-white hover:text-blue-200' : 'text-gray-900 hover:text-blue-600'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          <BrandLogo size={32} />
          <span className="text-xl font-bold">Meetly.ai</span>
        </motion.button>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </motion.button>

          <motion.button
            onClick={goToLanding}
            className={`backdrop-blur-sm px-6 py-2 rounded-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-900/10 text-gray-900 hover:bg-gray-900/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>
        </div>
      </motion.nav>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-6 py-20 max-w-4xl relative z-10">
        {/* Enhanced Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <motion.h1
            className={`text-5xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Process Your Meeting
          </motion.h1>
          <motion.p
            className={`text-xl max-w-2xl mx-auto leading-relaxed transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Transform your meeting recordings and transcripts into organized summaries, action points, and decisions with AI-powered intelligence
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: Zap, text: "Lightning Fast" },
              { icon: Shield, text: "Secure & Private" },
              { icon: Star, text: "AI Powered" }
            ].map((feature) => (
              <motion.div
                key={feature.text}
                variants={itemVariants}
                className={`flex items-center space-x-2 backdrop-blur-sm px-4 py-2 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-white/10 text-white' 
                    : 'bg-gray-900/10 text-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <feature.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.header>

        {/* Main Content Area */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {currentStep === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`backdrop-blur-xl rounded-3xl shadow-2xl p-10 border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/95 border-gray-700' 
                  : 'bg-white/95 border-gray-200'
              }`}
              style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)' }}
            >
              <motion.div
                className="space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Enhanced File Upload Section */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-2xl font-bold mb-6 flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Upload className={`w-6 h-6 mr-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    Upload Meeting Recording
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="file-upload"
                    />
                    <motion.label
                      htmlFor="file-upload"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center w-full h-40 border-3 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        isDragOver || uploadedFile
                          ? isDarkMode 
                            ? 'border-blue-400 bg-blue-900/20 scale-105' 
                            : 'border-blue-500 bg-blue-50 scale-105'
                          : isDarkMode 
                            ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-800/50' 
                            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={uploadedFile ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Upload className={`w-12 h-12 mb-3 transition-colors ${
                          uploadedFile ? 'text-green-500' : 'text-blue-500'
                        }`} />
                      </motion.div>
                      <span className={`font-bold text-lg transition-colors ${
                        uploadedFile 
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {uploadedFile ? uploadedFile.name : 'Drop your file here or click to upload'}
                      </span>
                      <span className={`text-sm mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Supports MP3, MP4, WAV, and more (Max 100MB)
                      </span>
                      {uploadedFile && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 flex items-center transition-colors duration-300 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">File ready for processing</span>
                        </motion.div>
                      )}
                    </motion.label>
                  </div>
                </motion.div>

                {/* Enhanced Divider */}
                <motion.div
                  className="flex items-center"
                  variants={itemVariants}
                >
                  <div className={`flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-colors duration-300 ${
                    isDarkMode ? 'via-gray-600' : 'via-gray-300'
                  }`}></div>
                  <motion.span
                    className={`px-6 font-bold rounded-full border-2 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-800 border-gray-600' 
                        : 'text-gray-500 bg-white border-gray-200'
                    }`}
                    whileHover={{ scale: 1.1, borderColor: "#3B82F6" }}
                  >
                    OR
                  </motion.span>
                  <div className={`flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-colors duration-300 ${
                    isDarkMode ? 'via-gray-600' : 'via-gray-300'
                  }`}></div>
                </motion.div>

                {/* Enhanced Transcript Section */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="transcript" className={`block text-2xl font-bold mb-6 flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <FileText className={`w-6 h-6 mr-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    Paste Meeting Transcript
                  </label>
                  <div className="relative">
                    <motion.div
                      className="absolute top-5 left-5 z-10"
                      animate={{ opacity: transcript ? 0.5 : 1 }}
                    >
                      <FileText className={`w-6 h-6 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </motion.div>
                    <motion.textarea
                      id="transcript"
                      value={transcript}
                      onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setTranscript(e.target.value);
                      }, [])}
                      placeholder="Paste your meeting transcript here..."
                      className={`w-full h-48 pl-16 pr-6 py-6 border-2 rounded-2xl resize-none transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-gray-600 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-white placeholder-gray-400 bg-gray-800' 
                          : 'border-gray-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white'
                      }`}
                      whileFocus={{ scale: 1.01 }}
                    />
                    {transcript && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {transcript.length} characters
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Enhanced Generate Button */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    type="button"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
                    }}
                    onClick={handleGenerateSummary}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-4 text-xl shadow-xl relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      whileTap={{ x: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="relative z-10"
                    >
                      <Sparkles className="w-7 h-7" />
                    </motion.div>
                    <span className="relative z-10">Generate AI Summary</span>
                    <ArrowRight className="w-6 h-6 relative z-10" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`backdrop-blur-xl rounded-3xl shadow-2xl p-16 border text-center transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/95 border-gray-700' 
                  : 'bg-white/95 border-gray-200'
              }`}
            >
              <motion.div className="space-y-8">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="inline-block"
                >
                  <div className="relative">
                    <Sparkles className="w-16 h-16 text-blue-600" />
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-16 h-16 text-purple-600" />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.h2
                  className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI is Processing Your Meeting
                </motion.h2>

                <motion.div className="space-y-4">
                  {[
                    "Analyzing audio content...",
                    "Extracting key insights...",
                    "Generating action points...",
                    "Finalizing summary..."
                  ].map((text, index) => (
                    <motion.p
                      key={index}
                      className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.5, duration: 0.5 }}
                    >
                      {text}
                    </motion.p>
                  ))}
                </motion.div>

                {/* Progress bar */}
                <div className={`w-full rounded-full h-2 overflow-hidden transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Enhanced Meeting Summary */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`backdrop-blur-xl rounded-3xl shadow-2xl p-10 border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/95 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                }`}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center mb-8">
                  <motion.div
                    className={`p-3 rounded-xl mr-4 transition-colors duration-300 ${
                      isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                    }`}
                    whileHover={{ rotate: 5 }}
                  >
                    <FileText className={`w-8 h-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </motion.div>
                  <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>📌 Meeting Summary</h2>
                </div>
                <motion.p
                  className={`leading-relaxed text-lg transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {results.summary}
                </motion.p>
              </motion.div>

              {/* Enhanced Action Points */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`backdrop-blur-xl rounded-3xl shadow-2xl p-10 border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/95 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                }`}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center mb-8">
                  <motion.div
                    className={`p-3 rounded-xl mr-4 transition-colors duration-300 ${
                      isDarkMode ? 'bg-green-900' : 'bg-green-100'
                    }`}
                    whileHover={{ rotate: -5 }}
                  >
                    <CheckCircle className={`w-8 h-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </motion.div>
                  <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>✅ Action Points</h2>
                </div>
                <div className="space-y-5">
                  {results.actionPoints.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`flex items-start space-x-4 p-6 rounded-2xl border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700' 
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'
                      }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 10px 30px rgba(34, 197, 94, 0.1)"
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                      </motion.div>
                      <div className="flex-1">
                        <p className={`font-bold text-lg transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{action.task}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 mt-3 text-sm">
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}><strong className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-800'
                          }`}>Assigned to:</strong> {action.person}</span>
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}><strong className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-800'
                          }`}>Due:</strong> {action.deadline}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Enhanced Decisions */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`backdrop-blur-xl rounded-3xl shadow-2xl p-10 border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/95 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                }`}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center mb-8">
                  <motion.div
                    className={`p-3 rounded-xl mr-4 transition-colors duration-300 ${
                      isDarkMode ? 'bg-purple-900' : 'bg-purple-100'
                    }`}
                    whileHover={{ rotate: 5 }}
                  >
                    <Clock className={`w-8 h-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </motion.div>
                  <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>⏰ Decisions</h2>
                </div>
                <div className="space-y-4">
                  {results.decisions.map((decision, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`flex items-start space-x-4 p-6 rounded-2xl border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-purple-900/20 to-violet-900/20 border-purple-700' 
                          : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'
                      }`}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 10px 30px rgba(147, 51, 234, 0.1)"
                      }}
                    >
                      <motion.div
                        className="w-3 h-3 bg-purple-600 rounded-full mt-3 flex-shrink-0"
                        whileHover={{ scale: 1.5 }}
                      />
                      <p className={`text-lg font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{decision}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 15px 35px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)"
                  }}
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileTap={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <Download className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Download as PDF</span>
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 15px 35px rgba(34, 197, 94, 0.4)"
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.3)"
                  }}
                  onClick={handleEmailTeam}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileTap={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <Mail className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Email to Team</span>
                </motion.button>
              </motion.div>

              {/* Enhanced New Meeting Button */}
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.9)"
                }}
                whileTap={{ 
                  scale: 0.95,
                  boxShadow: "0 0 0 4px rgba(156, 163, 175, 0.3)"
                }}
                onClick={resetForm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`w-full backdrop-blur-sm font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 border shadow-lg relative overflow-hidden group ${
                  isDarkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-white border-gray-600' 
                    : 'bg-white/80 hover:bg-white/90 text-gray-900 border-gray-200'
                }`}
              >
                <motion.div
                  className={`absolute inset-0 ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-100/50'
                  }`}
                  initial={{ x: "-100%" }}
                  whileTap={{ x: "100%" }}
                  transition={{ duration: 0.3 }}
                />
                <FileAudio className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Process Another Meeting</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );

  // Pricing Page Component
  const PricingPage = () => (
    <div className={`min-h-screen relative transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-white via-pink-100 to-rose-100 text-gray-900'
    }`}>
      {/* Navigation */}
      <motion.nav
        className={`flex justify-between items-center p-6 relative z-20 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.button
          onClick={goToLanding}
          className={`flex items-center space-x-3 transition-colors ${
            isDarkMode ? 'text-white hover:text-blue-200' : 'text-gray-900 hover:text-blue-600'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          <BrandLogo size={32} />
          <span className="text-xl font-bold">Meetly.ai</span>
        </motion.button>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </motion.button>

          <motion.button
            onClick={goToLanding}
            className={`backdrop-blur-sm px-6 py-2 rounded-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-900/10 text-gray-900 hover:bg-gray-900/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Choose Your Plan</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`text-5xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Simple, Transparent Pricing
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Start free and scale as you grow. No hidden fees, no surprises.
            </motion.p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "forever",
                description: "Perfect for individuals and small teams",
                features: [
                  "Up to 10 meetings per month",
                  "Basic AI summaries",
                  "Action item extraction",
                  "Email support",
                  "Standard processing time"
                ],
                buttonText: "Get Started Free",
                buttonVariant: "secondary",
                popular: false
              },
              {
                name: "Pro",
                price: "$29",
                period: "per month",
                description: "Best for growing teams and businesses",
                features: [
                  "Unlimited meetings",
                  "Advanced AI insights",
                  "API integrations (Zoom, Google Meet, Teams)",
                  "Priority support",
                  "Custom templates",
                  "Team collaboration",
                  "Advanced analytics",
                  "Slack & Notion integration"
                ],
                buttonText: "Start Pro Trial",
                buttonVariant: "primary",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "per month",
                description: "For large organizations with custom needs",
                features: [
                  "Everything in Pro",
                  "Custom AI models",
                  "Dedicated account manager",
                  "SSO & advanced security",
                  "Custom integrations",
                  "White-label options",
                  "Advanced compliance",
                  "24/7 phone support"
                ],
                buttonText: "Contact Sales",
                buttonVariant: "secondary",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.2, duration: 0.8 }}
                whileHover={{ y: -5 }}
                className={`relative p-8 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? isDarkMode 
                      ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-blue-500 shadow-2xl' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-2xl'
                    : isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold ${
                      isDarkMode 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
                  >
                    Most Popular
                  </motion.div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{plan.name}</h3>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{plan.price}</span>
                    <span className={`text-lg transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>/{plan.period}</span>
                  </div>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-center space-x-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ 
                    scale: 0.95,
                    boxShadow: plan.buttonVariant === 'primary' 
                      ? "0 0 0 4px rgba(59, 130, 246, 0.3)"
                      : "0 0 0 4px rgba(156, 163, 175, 0.3)"
                  }}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden group ${
                    plan.buttonVariant === 'primary'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      : isDarkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600' 
                        : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <motion.div
                    className={`absolute inset-0 ${
                      plan.buttonVariant === 'primary' ? 'bg-white/20' : isDarkMode ? 'bg-white/10' : 'bg-gray-100/50'
                    }`}
                    initial={{ x: "-100%" }}
                    whileTap={{ x: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">{plan.buttonText}</span>
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className={`rounded-2xl p-12 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-lg'
            }`}
          >
            <h3 className={`text-3xl font-bold text-center mb-12 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Frequently Asked Questions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: "Can I change plans anytime?",
                  answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
                },
                {
                  question: "Is there a free trial?",
                  answer: "Yes! Pro plan comes with a 14-day free trial. No credit card required to start."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "We offer a 30-day money-back guarantee for all paid plans."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Absolutely. You can cancel your subscription at any time with no cancellation fees."
                },
                {
                  question: "Is my data secure?",
                  answer: "Yes, we use enterprise-grade encryption and security measures to protect your data."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 + index * 0.1, duration: 0.6 }}
                  className="space-y-3"
                >
                  <h4 className={`font-semibold text-lg transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{faq.question}</h4>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentPage === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LandingPage />
        </motion.div>
      )}
      {currentPage === 'app' && (
        <motion.div
          key="app"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
        >
          <MainApp />
        </motion.div>
      )}
      {currentPage === 'pricing' && (
        <motion.div
          key="pricing"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <PricingPage />
        </motion.div>
      )}
    </>
  );
};

export default App;
