import { Link } from "react-router-dom";

function Home({ user, username }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-16 text-center relative">
        {/* Gradient overlay covering the entire page */}
        <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950 dark:to-transparent opacity-50 -z-10"></div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight relative z-10">
          Discover{" "}
          <span className="text-blue-600 dark:text-blue-400">SynapShare</span>
        </h1>
        <p className="text-xl text-gray-800 dark:text-gray-100 max-w-3xl mx-auto mb-8 relative z-10">
          Connect, collaborate, and grow with a vibrant community. Explore
          notes, discussions, and ideas like never before.
        </p>
        {user ? (
          <div className="flex justify-center items-center gap-4 bg-white dark:bg-gray-800 rounded-full py-3 px-6 shadow-lg max-w-md mx-auto relative z-10">
            <div className="w-14 h-14 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {username
                ? username.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {username || user.email.split("@")[0]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="inline-block bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md relative z-10"
          >
            Join the Community
          </Link>
        )}
      </section>

      {/* Navigation Cards - fill the available space */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-auto">
        <Link
          to="/notes"
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <svg
            className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Notes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Create and share study notes effortlessly
          </p>
        </Link>
        <Link
          to="/discussions"
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <svg
            className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Discussions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Join vibrant community conversations
          </p>
        </Link>
        <Link
          to="/nodes"
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <svg
            className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 012 2v2a2 2 0 01-2 2m0 0a2 2 0 01-2 2H6a2 2 0 01-2-2m12-6a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 0a2 2 0 01-2 2v2a2 2 0 002 2m0 0a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Nodes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Discover interconnected ideas
          </p>
        </Link>
        <Link
          to="/news"
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-200 to-transparent dark:from-blue-900 dark:to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
          <svg
            className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            News
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
            Stay informed with the latest updates
          </p>
        </Link>
      </section>
    </div>
  );
}

export default Home;
