import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LogOut, User, Sparkles, Lock, Mail, Eye, EyeOff, ArrowRight, CreditCard, TrendingUp } from 'lucide-react';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Login/Signup states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // AI Advice states
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState(null);
  const [gettingAdvice, setGettingAdvice] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password }
      : { name, email, password };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
      } else {
        toast.error(data.error || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const getAdvice = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    setGettingAdvice(true);
    setAdvice(null);
    
    try {
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdvice(data.data);
      } else {
        toast.error(data.error || 'Failed to get advice');
      }
    } catch (error) {
      toast.error('Server error. Please try again.');
    } finally {
      setGettingAdvice(false);
    }
  };

  // If user is logged in, show main app
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Toaster position="top-right" />
        
        {/* Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FinAI Advisor</h1>
                  <p className="text-xs text-gray-500">Powered by Gemini AI</p>
                </div>
              </div>
              
              {/* User Info & Logout */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl flex items-center space-x-2 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Welcome Banner */}
          <div className="mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                  <p className="text-blue-100">Get personalized financial advice powered by AI</p>
                </div>
                <div className="hidden md:block">
                  <TrendingUp className="w-24 h-24 opacity-20" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Advice Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Input */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Ask Your Financial Question</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      What financial decision are you considering?
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g., Should I buy a new laptop now or save for vacation?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm text-lg"
                      rows="4"
                      disabled={gettingAdvice}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-gray-500">
                        {question.length}/500 characters
                      </span>
                      <button
                        onClick={getAdvice}
                        disabled={gettingAdvice || !question.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                      >
                        {gettingAdvice ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Get AI Advice
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Example Questions */}
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-3">Try these examples:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Should I buy a new laptop now or save for vacation?",
                        "Is it a good time to invest in stocks?",
                        "Should I pay off debt or build emergency fund?",
                        "Is buying a house better than renting?"
                      ].map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuestion(example)}
                          className="px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advice Result */}
              {advice && (
                <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-500 mb-2">YOUR QUESTION</h4>
                      <p className="text-xl font-semibold text-gray-900">"{advice.question}"</p>
                    </div>
                    <div className={`px-6 py-3 rounded-xl font-bold text-lg ${advice.verdict === 'DO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {advice.verdict}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <h5 className="text-lg font-medium text-gray-700 mb-3">AI Analysis</h5>
                    <div className={`p-5 rounded-xl ${advice.verdict === 'DO' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-lg">{advice.reason}</p>
                    </div>
                    <div className="mt-4 text-sm text-gray-500 text-right">
                      Powered by Gemini AI • {new Date(advice.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - User Stats & Tips */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h3>
                
                <div className="space-y-6">
                  {/* User Card */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                      <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">AI</p>
                      <p className="text-sm text-gray-600">Powered</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                      <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">Real</p>
                      <p className="text-sm text-gray-600">Time Advice</p>
                    </div>
                  </div>
                  
                  {/* Tips */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">💡 Pro Tip</h4>
                    <p className="text-sm text-gray-700">
                      For best results, be specific about amounts, timelines, and your current financial situation.
                    </p>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If user is NOT logged in, show auth pages
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Toaster position="top-right" />
      
      {/* Animated Background */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md">
        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to access AI financial advice' 
                : 'Join FinAI Advisor for personalized guidance'}
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Name Field (only for register) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="Enter your name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login/Register */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">AI Powered</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">Real-time</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">Free Forever</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;