'use client';

import { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface ReportButtonProps {
  targetType: 'VENUE' | 'BOOKING' | 'USER';
  targetId: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  inDropdown?: boolean;
}

export function ReportButton({ 
  targetType, 
  targetId, 
  className, 
  size = 'sm', 
  variant = 'ghost',
  inDropdown = false 
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { value: 'FACILITY_ISSUE', label: 'Facility Issue' },
    { value: 'USER_BEHAVIOR', label: 'Inappropriate Behavior' },
    { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
    { value: 'SAFETY_CONCERN', label: 'Safety Concern' },
    { value: 'SPAM', label: 'Spam/Scam' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Prevent dialog from closing when interacting with form elements
  useEffect(() => {
    if (isOpen && inDropdown) {
      const handleClick = (e: Event) => {
        e.stopPropagation();
      };
      
      // Find all dialog content and prevent clicks from bubbling
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        dialogContent.addEventListener('click', handleClick);
        return () => {
          dialogContent.removeEventListener('click', handleClick);
        };
      }
    }
  }, [isOpen, inDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !title.trim()) return;

    setIsSubmitting(true);
    try {
      // Transform the data to match the API schema
      const reportData: any = {
        type: reportType,
        title,
        description: description || "none", // Send undefined if empty
      };

      // Add the appropriate target field based on targetType
      if (targetType === 'VENUE' || targetType === 'BOOKING') {
        // For both venues and bookings, report the facility
        reportData.reportedFacilityId = targetId;
      } else if (targetType === 'USER') {
        reportData.reportedUserId = targetId;
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        setIsOpen(false);
        setReportType('');
        setTitle('');
        setDescription('');
        // Show success message
        alert('Report submitted successfully');
      } else {
        const errorData = await response.json();
        console.error('Report submission error:', errorData);
        alert('Failed to submit report: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If in dropdown, delay opening slightly to prevent immediate close
    if (inDropdown) {
      setTimeout(() => setIsOpen(true), 10);
    } else {
      setIsOpen(true);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setReportType('');
      setTitle('');
      setDescription('');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleButtonClick}
        onMouseDown={(e) => {
          if (inDropdown) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Flag className="h-4 w-4 mr-2" />
        Report
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange} modal>
        <DialogContent 
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking outside if in dropdown
            if (inDropdown) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Allow escape key to close dialog
            setIsOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <Label htmlFor="reportType">Type of Issue</Label>
              <Select value={reportType} onValueChange={setReportType} required>
                <SelectTrigger onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about the issue"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={(e) => e.stopPropagation()}
                disabled={isSubmitting || !reportType || !title.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}