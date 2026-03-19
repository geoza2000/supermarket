import { Github } from 'lucide-react';
import { APP_URL, GITHUB_URL } from '@/config/constants';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-200/60 bg-surface-50/50">
      <div className="section-container py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Supermarket List" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-surface-900">
              Supermarket List
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-surface-900/50">
            <a href="#features" className="hover:text-brand-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">
              How It Works
            </a>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors"
            >
              Open App
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors inline-flex items-center gap-1.5"
            >
              <Github size={16} />
              GitHub
            </a>
          </nav>

          <p className="text-sm text-surface-900/40">
            &copy; {year} Supermarket List
          </p>
        </div>
      </div>
    </footer>
  );
}
