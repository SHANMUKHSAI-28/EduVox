import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-hero sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left animate-fade-in">
                <h1 className="text-4xl tracking-tight font-extrabold text-secondary-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Welcome to</span>{' '}
                  <span className="block text-gradient-primary xl:inline text-shadow">EduVox</span>
                </h1>
                <p className="mt-3 text-base text-secondary-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Your comprehensive platform for educational guidance, university shortlisting, and academic planning. 
                  Get personalized recommendations and expert advice to shape your educational journey.
                </p>
                <div className="mt-8 sm:mt-12 sm:flex sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="rounded-md shadow-lg">
                    <Link to="/signup">
                      <Button variant="gradient" size="lg" className="w-full px-8 py-4 text-lg animate-bounce-gentle">
                        🚀 Get Started
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="w-full px-8 py-4 text-lg">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Hero Image/Illustration */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-primary sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-bounce-gentle"></div>
              <div className="absolute top-20 right-20 w-16 h-16 bg-accent-300 rounded-full animate-pulse"></div>
              <div className="absolute bottom-20 left-20 w-12 h-12 bg-secondary-200 rounded-full animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
            
            <div className="text-center text-white relative z-10">
              <div className="mb-8 animate-slide-up">
                <svg className="mx-auto h-32 w-32 mb-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-shadow-lg">Education First</h3>
              <p className="text-xl text-primary-100 text-shadow">Empowering your academic future</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center animate-fade-in">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-900 sm:text-4xl">
              Everything you need for your educational journey
            </p>
            <p className="mt-4 max-w-2xl text-xl text-secondary-500 lg:mx-auto">
              Comprehensive tools and expert guidance to help you make informed decisions about your education.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* University Shortlisting */}
              <div className="feature-card group">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-gradient-primary text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">University Shortlisting</h3>
                <p className="text-secondary-600">
                  Get personalized university recommendations based on your academic profile, preferences, and career goals.
                </p>
              </div>

              {/* Expert Consultation */}
              <div className="feature-card group">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-gradient-accent text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">Expert Consultation</h3>
                <p className="text-secondary-600">
                  Connect with education consultants who provide personalized guidance for your academic and career planning.
                </p>
              </div>

              {/* Academic Planning */}
              <div className="feature-card group">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-gradient-to-r from-success-500 to-success-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">Academic Planning</h3>
                <p className="text-secondary-600">
                  Create detailed academic roadmaps with timeline tracking and milestone management for your educational goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start your journey?</span>
            <span className="block text-primary-200">Join EduVox today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-100">
            Take the first step towards achieving your educational goals with personalized guidance and comprehensive planning tools.
          </p>
          <Link to="/signup">
            <Button 
              variant="secondary" 
              size="lg" 
              className="mt-8 px-8 py-4 text-lg bg-white text-primary-600 hover:bg-primary-50 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
