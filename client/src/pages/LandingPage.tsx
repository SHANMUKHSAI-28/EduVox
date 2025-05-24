import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GlobeAltIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <GlobeAltIcon className="h-8 w-8" />,
      title: "Global University Database",
      description: "Access thousands of universities worldwide with comprehensive information on programs, requirements, and rankings."
    },
    {
      icon: <AcademicCapIcon className="h-8 w-8" />,
      title: "Smart Matching",
      description: "AI-powered matching algorithm that finds universities based on your academic profile, preferences, and goals."
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Compare Universities",
      description: "Side-by-side comparison tools to help you make informed decisions about your education future."
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "Expert Guidance",
      description: "Connect with education consultants and get personalized advice for your university applications."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      university: "Stanford University",
      quote: "EduVox helped me discover universities I never knew existed. The matching algorithm was spot-on!",
      rating: 5
    },
    {
      name: "Ahmed Hassan",
      university: "University of Oxford",
      quote: "The comparison feature saved me weeks of research. I could easily see which programs fit my needs.",
      rating: 5
    },
    {
      name: "Maria Rodriguez",
      university: "MIT",
      quote: "Thanks to EduVox's guidance, I got into my dream university with a full scholarship.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10,000+", label: "Universities" },
    { number: "50+", label: "Countries" },
    { number: "100,000+", label: "Students Helped" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">EduVox</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 transition-colors">Login</Link>
              <Link 
                to="/auth/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Journey to 
              <span className="text-blue-600"> Global Education</span> 
              Starts Here
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover, compare, and apply to universities worldwide with our AI-powered platform. 
              Get personalized guidance from expert consultants and make your dream education a reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/auth/register" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Start Your Journey
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/universities" 
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Explore Universities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for University Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and guidance you need to find and apply to your dream university.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How EduVox Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your dream university
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Profile</h3>
              <p className="text-gray-600">
                Tell us about your academic background, interests, and goals to get personalized recommendations.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover & Compare</h3>
              <p className="text-gray-600">
                Explore universities, compare programs, and use our smart matching to find your perfect fit.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Expert Guidance</h3>
              <p className="text-gray-600">
                Work with our consultants to optimize your applications and increase your chances of success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Hear from students who achieved their dreams with EduVox
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-blue-600 text-sm">{testimonial.university}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have found their perfect university match with EduVox.
          </p>
          <Link 
            to="/auth/register" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Get Started for Free
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-2xl font-bold">EduVox</span>
              </div>
              <p className="text-gray-400">
                Empowering students to achieve their global education dreams through technology and expert guidance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Universities</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Consultants</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EduVox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
