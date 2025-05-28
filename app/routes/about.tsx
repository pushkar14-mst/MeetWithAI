import { Link } from "@remix-run/react";
import { signInWithGoogle } from "~/utils/firebaseClient";
import Navbar from "~/components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">About Whispr</h1>
            <p className="text-lg text-gray-600 mb-6">
              Whispr is a modern meeting management platform designed to help teams collaborate more effectively and preserve important conversations.
            </p>
          </div>

          <div className="mt-12 space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600">
                We believe that every meeting should be meaningful and productive. Our mission is to transform how teams communicate by providing tools that make meetings more efficient and memorable. With Whispr, you can focus on what matters most - the conversation - while we handle the rest.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Real-time meeting transcription and summarization</li>
                <li>Smart meeting scheduling and management</li>
                <li>Seamless Google Calendar integration</li>
                <li>AI-powered meeting insights and analytics</li>
                <li>Secure meeting recording and storage</li>
                <li>Customizable settings for team preferences</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Whispr?</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <span className="font-semibold">Save Time:</span> Automatically transcribe and summarize your meetings, so you can focus on the discussion.
                </p>
                <p>
                  <span className="font-semibold">Stay Organized:</span> Keep all your meeting notes, recordings, and insights in one place.
                </p>
                <p>
                  <span className="font-semibold">Boost Productivity:</span> Get AI-powered insights and action items from your meetings.
                </p>
                <p>
                  <span className="font-semibold">Seamless Integration:</span> Works perfectly with your existing Google Workspace tools.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
              <p className="text-gray-600 mb-4">
                Ready to transform your team's meeting experience? Start using Whispr today and see the difference for yourself.
              </p>
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    window.location.href = "/dashboard";
                  } catch (e) {
                    alert("Sign in failed");
                  }
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-[#4B3576] hover:bg-[#3a285c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4B3576] transition-colors"
              >
                Try Whispr Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 