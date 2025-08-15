"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock FAQ data - In a real app, this would come from an API
const faqData = [
  {
    id: "1",
    category: "Booking",
    question: "How do I cancel my booking?",
    answer: "You can cancel your booking by going to the 'My Bookings' section in your dashboard and clicking the 'Cancel' button next to your booking. Please note that cancellation policies may apply depending on how far in advance you cancel.",
  },
  {
    id: "2",
    category: "Booking",
    question: "Can I modify my booking time?",
    answer: "Yes, you can modify your booking time if there are available slots. Go to 'My Bookings', select the booking you want to modify, and choose a new available time slot. Additional charges may apply for peak hours.",
  },
  {
    id: "3",
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI payments, net banking, and popular digital wallets. All payments are processed securely through our payment partners.",
  },
  {
    id: "4",
    category: "Payment",
    question: "How do refunds work?",
    answer: "Refunds are processed according to our cancellation policy. Typically, refunds take 3-7 business days to reflect in your account. The exact timing depends on your bank and payment method.",
  },
  {
    id: "5",
    category: "Account",
    question: "How do I reset my password?",
    answer: "Click on 'Forgot Password' on the login page and enter your email address. You'll receive a password reset link via email. Follow the instructions to create a new password.",
  },
  {
    id: "6",
    category: "Account",
    question: "How do I update my profile information?",
    answer: "Go to your profile settings by clicking on your avatar in the top right corner, then select 'Profile'. You can update your personal information, contact details, and preferences from there.",
  },
  {
    id: "7",
    category: "Facilities",
    question: "How do I find facilities near me?",
    answer: "Use the search feature on our homepage or the 'Find Venues' page. You can filter by location, sport type, price range, and amenities to find facilities that match your preferences.",
  },
  {
    id: "8",
    category: "Facilities",
    question: "What if a facility is not available at my preferred time?",
    answer: "You can check alternative time slots or explore other nearby facilities. We also offer a notification feature where you'll be alerted if your preferred slot becomes available due to cancellations.",
  },
];

const categories = ["All", "Booking", "Payment", "Account", "Facilities"];

export function SupportFAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `No FAQs match your search for "${searchTerm}"`
                  : "No FAQs available for the selected category"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq) => {
            const isOpen = openItems.includes(faq.id);
            
            return (
              <Card key={faq.id}>
                <Collapsible open={isOpen} onOpenChange={() => toggleItem(faq.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-1">
                            <CardTitle className="text-base font-medium text-left">
                              {faq.question}
                            </CardTitle>
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isOpen ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="pl-0">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Still need help?
          </h3>
          <p className="text-blue-700 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Support Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
