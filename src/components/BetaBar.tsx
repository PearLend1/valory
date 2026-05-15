import { X } from 'lucide-react';
import { useState } from 'react';

export default function BetaBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-50 bg-[#E81F7A] text-white px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-lg">🧪</span>
        <p className="text-sm md:text-base font-medium">
          Valory is in Beta — Your feedback helps shape the future!
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/beta-signup"
          className="px-4 py-2 bg-white text-[#E81F7A] rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all whitespace-nowrap"
        >
          Join Beta
        </a>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all"
          aria-label="Close beta bar"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
