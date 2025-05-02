import { FiGithub, FiGlobe } from "react-icons/fi";

function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300">
        <span>© 2025 SynapShare. Made by Kamlesh Porwal</span>
        <div className="flex gap-3">
          <a
            href="https://www.linkedin.com/in/kamlesh-porwal-2b1a2a1a6/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            <FiGlobe size={16} />
          </a>
          <a
            href="https://github.com/kamleshp214"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            <FiGithub size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
