import React from "react";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy for all our watches. If you&apos;re not completely satisfied with your purchase, you can return it for a full refund.",
    },
    {
      question: "How do I know if the watch is authentic?",
      answer:
        "All our watches come with authenticity certificates and are sourced directly from authorized dealers. We guarantee 100% authenticity.",
    },
    {
      question: "What warranty do you provide?",
      answer:
        "Our watches come with a 2-year international warranty that covers manufacturing defects and mechanical issues.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes, we offer worldwide shipping. Shipping costs and delivery times vary depending on your location.",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6 mt-8 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-3 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100 transition-colors">
              {faq.question}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
