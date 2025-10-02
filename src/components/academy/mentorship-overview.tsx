'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface MentorshipOverviewProps {
  onJoinProgram?: () => void;
  onFindMentor?: () => void;
  onBecomeMentor?: () => void;
}

export function MentorshipOverview({ 
  onJoinProgram, 
  onFindMentor, 
  onBecomeMentor 
}: MentorshipOverviewProps) {
  const programStats = {
    totalMentors: 150,
    activeMentorships: 320,
    successRate: 94,
    avgRating: 4.8
  };

  const benefits = [
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: 'Expert Guidance',
      description: 'Learn from industry professionals with years of experience in your field'
    },
    {
      icon: <AcademicCapIcon className="h-6 w-6" />,
      title: 'Personalized Learning',
      description: 'Get customized advice and learning paths tailored to your goals'
    },
    {
      icon: <TrophyIcon className="h-6 w-6" />,
      title: 'Career Growth',
      description: 'Accelerate your career with insider knowledge and networking opportunities'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      title: 'Ongoing Support',
      description: 'Regular check-ins and continuous support throughout your journey'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Find Your Mentor',
      description: 'Browse our network of experienced professionals and find the perfect match for your goals',
      icon: <UserGroupIcon className="h-8 w-8" />
    },
    {
      step: 2,
      title: 'Set Goals Together',
      description: 'Work with your mentor to define clear, achievable goals and create a learning roadmap',
      icon: <CheckCircleIcon className="h-8 w-8" />
    },
    {
      step: 3,
      title: 'Regular Sessions',
      description: 'Meet regularly through video calls, code reviews, and project discussions',
      icon: <CalendarIcon className="h-8 w-8" />
    },
    {
      step: 4,
      title: 'Track Progress',
      description: 'Monitor your growth and celebrate milestones as you advance in your career',
      icon: <TrophyIcon className="h-8 w-8" />
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Junior Developer',
      avatar: '/avatars/testimonial-1.png',
      rating: 5,
      text: 'My mentor helped me land my first game development job. The personalized guidance was invaluable!',
      mentor: 'Sarah Chen'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      role: 'Game Artist',
      avatar: '/avatars/testimonial-2.png',
      rating: 5,
      text: 'The portfolio review sessions completely transformed my art. I got hired within 2 months!',
      mentor: 'Alex Artist'
    },
    {
      id: 3,
      name: 'David Kim',
      role: 'Game Designer',
      avatar: '/avatars/testimonial-3.png',
      rating: 4,
      text: 'Learning game design principles from an industry veteran gave me the confidence to start my own indie studio.',
      mentor: 'Mike Rodriguez'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">The Guild</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with industry experts and accelerate your game development career through personalized mentorship
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onFindMentor}>
            Find a Mentor
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Button>
          <Button size="lg" variant="outline" onClick={onBecomeMentor}>
            Become a Mentor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{programStats.totalMentors}+</div>
            <div className="text-sm text-gray-600">Expert Mentors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{programStats.activeMentorships}+</div>
            <div className="text-sm text-gray-600">Active Mentorships</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{programStats.successRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{programStats.avgRating}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Mentorship Program?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our mentorship program is designed to provide you with the guidance, support, and expertise you need to succeed in the game development industry.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-blue-600 mb-4 flex justify-center">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Getting started with mentorship is simple. Follow these four steps to begin your journey.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, index) => (
            <div key={step.step} className="relative">
              <Card className="h-full">
                <CardContent className="p-6 text-center">
                  <div className="text-blue-600 mb-4 flex justify-center">
                    {step.icon}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{step.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Arrow connector */}
              {index < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from our community members who have transformed their careers through mentorship.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">Mentored by {testimonial.mentor}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Flexible Mentorship Options</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the mentorship plan that fits your needs and budget.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Community Mentorship */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-lg font-semibold">Community</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">Free</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Group mentorship sessions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Community Q&A access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Resource library
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Peer networking
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={onJoinProgram}>
                Join Community
              </Button>
            </CardContent>
          </Card>

          {/* 1-on-1 Mentorship */}
          <Card className="border-2 border-blue-500 relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-lg font-semibold">1-on-1</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">$50-100</div>
                <div className="text-sm text-gray-600">per session</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Personal mentor matching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Flexible scheduling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Code reviews & feedback
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Career guidance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Goal tracking
                </li>
              </ul>
              <Button className="w-full" onClick={onFindMentor}>
                Find Your Mentor
              </Button>
            </CardContent>
          </Card>

          {/* Premium Program */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-lg font-semibold">Premium</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">$200</div>
                <div className="text-sm text-gray-600">per month</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Multiple mentor access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Priority scheduling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Portfolio development
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Interview preparation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Job placement support
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Mentorship Journey?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of developers who have accelerated their careers through our mentorship program. 
            Take the first step towards your dream job today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={onFindMentor}>
              Find a Mentor Now
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}