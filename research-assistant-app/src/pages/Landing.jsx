import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Navigation */}
      <nav className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Research AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Transform Research Papers into
            <span className="text-sky-600"> Structured Reports</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your research PDFs, provide a template, and let AI extract, restructure, 
            and rewrite content — without hallucination. Your sources, your structure, 
            professional output.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors w-full sm:w-auto"
            >
              Start Free Trial
            </Link>
            
              href="#features"
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Extraction</h3>
            <p className="text-gray-600">Upload research papers and we extract text, tables, figures, and citations automatically.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hallucination</h3>
            <p className="text-gray-600">Content is grounded in your sources. We never invent facts, statistics, or references.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Template</h3>
            <p className="text-gray-600">Upload your DOCX template and we fill it with restructured content matching your style.</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-4xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Your Research Papers</h3>
                <p className="text-gray-600 mt-1">Upload one or more PDF research papers. We'll extract all the content, metadata, and references.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Choose Your Template</h3>
                <p className="text-gray-600 mt-1">Upload a DOCX template with your desired structure — headings, sections, and formatting.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Generates Your Report</h3>
                <p className="text-gray-600 mt-1">Our AI maps source content to your template sections, rewrites for clarity, and maintains citations.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit and Export</h3>
                <p className="text-gray-600 mt-1">Review in our rich editor, make adjustments, and export as a professional DOCX document.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-24 text-center">
          <div className="bg-sky-600 rounded-2xl px-8 py-12 sm:px-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to streamline your research writing?
            </h2>
            <p className="text-sky-100 mb-8 max-w-2xl mx-auto">
              Join researchers, analysts, and professionals who save hours on document restructuring.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-colors"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-12 mt-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 Research AI Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}