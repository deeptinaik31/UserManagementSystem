import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 md:py-32 max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            Enterprise Grade Security
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 max-w-4xl">
            Secure User Management <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">
              For Modern Teams
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
            A robust, production-ready implementation of authentication, RBAC, and session management. Built with Next.js 15, MongoDB, and Tailwind CSS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-600/25 flex items-center justify-center gap-2"
            >
              Create Admin Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              Live Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'RBAC Authorization', desc: 'Granular access control with Admin and User roles.' },
              { title: 'JWT Authentication', desc: 'Secure stateless sessions with HTTP-only cookies.' },
              { title: 'Audit Logging', desc: 'Track every sign-in and sensitive action automatically.' },
              { title: 'Secure API', desc: 'Type-safe endpoints with Zod validation.' },
              { title: 'Modern Stack', desc: 'Next.js 15, Server Actions, and Tailwind CSS 4.' },
              { title: 'Database', desc: 'Optimized MongoDB schema with indexing.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-6 text-rose-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
