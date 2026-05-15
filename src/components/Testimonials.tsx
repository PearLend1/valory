import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialsProps {
  title?: string;
  items: Testimonial[];
  variant?: 'carousel' | 'grid';
}

export default function Testimonials({
  title = 'What Users Say',
  items,
  variant = 'carousel',
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (variant === 'grid') {
    return (
      <section className="w-full py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600 text-lg">Hear from our satisfied users</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {items.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Rating */}
                {testimonial.rating && (
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className="fill-orange-400 text-orange-400"
                      />
                    ))}
                  </div>
                )}

                {/* Quote */}
                <p className="text-gray-700 text-lg mb-6 italic">"{testimonial.quote}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {testimonial.avatar && (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    {testimonial.role && (
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Carousel variant
  return (
    <section className="w-full py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 text-lg">Hear from our satisfied users</p>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-white rounded-lg p-12 shadow-lg">
          {/* Testimonial Content */}
          <div className="text-center mb-8">
            <p className="text-2xl text-gray-900 font-semibold mb-6 italic">
              "{items[currentIndex].quote}"
            </p>
            <div className="flex items-center justify-center gap-3">
              {items[currentIndex].avatar && (
                <img
                  src={items[currentIndex].avatar}
                  alt={items[currentIndex].author}
                  className="w-14 h-14 rounded-full object-cover"
                />
              )}
              <div className="text-left">
                <p className="font-semibold text-gray-900">{items[currentIndex].author}</p>
                {items[currentIndex].role && (
                  <p className="text-sm text-gray-600">{items[currentIndex].role}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevTestimonial}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} className="text-purple-600" />
            </button>

            {/* Indicators */}
            <div className="flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-purple-600 w-8'
                      : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} className="text-purple-600" />
            </button>
          </div>

          {/* Counter */}
          <div className="text-center mt-6 text-sm text-gray-600">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      </div>
    </section>
  );
}
