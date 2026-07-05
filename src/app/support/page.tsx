"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  HelpCircle, 
  ChevronDown, 
  ExternalLink,
  Send,
  MessageCircle,
  FileQuestion,
  Headphones
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useToast } from "@/hooks/use-toast";

const supportFAQs = [
  {
    question: "How do I link my account to my parent's portal?",
    answer: "Go to Settings & Profile in the sidebar. You will see a 12-digit 'Parent Linking Code' (e.g. NSP-4X8K-92LQ). Copy this code and give it to your parents. They can input it into their NoteSwift Parent Portal under 'Add Student'."
  },
  {
    question: "Can I watch lesson lectures offline?",
    answer: "Offline downloading is supported in our NoteSwift Mobile App (Android/iOS). On the desktop web version, you can stream all video lectures directly with optimized local CDNs to minimize bandwidth usage."
  },
  {
    question: "How do I submit my assignments?",
    answer: "Navigate to the Learning Feed, select the 'Assignments' tab, find the active homework assignment, click 'Submit Answer', write your comments or attach a PDF/Image file of your work, then click Submit."
  },
  {
    question: "What should I do if a test attempt doesn't load?",
    answer: "Make sure you have an active internet connection. If the clock stops or questions do not render, reload the page. Since we persist test state, you will be able to resume where you left off if time is still remaining."
  }
];

function SupportContent() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // Simulate support ticket submit latency
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSending(false);
    toast({
      title: "Ticket Raised",
      description: "Our support agents will respond to your registered email shortly.",
    });
    setSubject("");
    setMessage("");
  };

  const handleWhatsAppRedirect = () => {
    window.open("https://wa.me/9779767464242", "_blank");
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Metrics Banner */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Call center card */}
        <Card className="border border-gray-300 shadow-sm bg-white p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-green-50 text-green-700 rounded-xl w-fit">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-800">WhatsApp Support</h4>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Connect directly with our support desk on WhatsApp for immediate help.
            </p>
          </div>
          <Button 
            onClick={handleWhatsAppRedirect}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-10 text-xs flex items-center justify-center gap-1.5"
          >
            Chat Now
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Card>

        {/* Support hours card */}
        <Card className="border border-gray-300 shadow-sm bg-white p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl w-fit">
              <Headphones className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-800">Support Hours</h4>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Our academic assistance desk is active 6 days a week to support you.
            </p>
          </div>
          <div className="text-[10px] text-gray-400 font-extrabold uppercase border-t border-gray-150 pt-2.5">
            Sunday – Friday • 9 AM to 6 PM
          </div>
        </Card>

        {/* Email support card */}
        <Card className="border border-gray-300 shadow-sm bg-white p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl w-fit">
              <Mail className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-800">Email Support</h4>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Send us detailed issues, course enrollments queries, or payments tickets.
            </p>
          </div>
          <a 
            href="mailto:support@noteswift.com" 
            className="w-full border border-gray-300 text-gray-700 font-bold rounded-xl h-10 text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 bg-white"
          >
            support@noteswift.com
          </a>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Support Ticket form */}
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl md:col-span-3">
          <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-5">
            <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-indigo-500" />
              Raise Support Ticket
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-semibold">
              Fill out the form below and our staff will investigate your query.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold text-gray-655">Subject *</Label>
                <Input
                  id="subject"
                  required
                  placeholder="e.g. Science course video won't load"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 border-gray-250 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-bold text-gray-655">Detailed Description *</Label>
                <Textarea
                  id="message"
                  required
                  placeholder="Provide step-by-step details about what you were doing when the issue occurred..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="border-gray-250 rounded-xl focus:border-blue-500 text-xs sm:text-sm font-medium"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-5 border border-blue-700 flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                <span>{isSending ? "Sending Ticket..." : "Submit Ticket"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl md:col-span-2 p-5 space-y-4 h-fit">
          <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            Frequently Asked Questions
          </h4>
          <Accordion type="single" collapsible className="w-full">
            {supportFAQs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-xs font-bold text-gray-700 hover:no-underline py-3 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-500 leading-relaxed font-semibold pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <SupportContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
