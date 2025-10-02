'use client';

import React, { useState } from 'react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleSelect, FormField, FormLabel } from '@/components/ui/accessible-form';

import { AccessibilityTesting, ColorContrast } from '@/lib/accessibility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AccessibilitySettings() {
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [auditResults, setAuditResults] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  React.useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
  }, []);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('sr-announcements');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${size}`);
    localStorage.setItem('accessibility-font-size', size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize as 'small' | 'medium' | 'large');
  };

  const runAccessibilityAudit = async () => {
    setIsAuditing(true);
    announceToScreenReader('Running accessibility audit', 'polite');

    // Simulate audit delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const issues = AccessibilityTesting.auditPage();
    setAuditResults(issues);
    setIsAuditing(false);

    const message = issues.length > 0 
      ? `Audit complete. Found ${issues.length} accessibility issues.`
      : 'Audit complete. No accessibility issues found.';
    
    announceToScreenReader(message, 'assertive');
  };

  const testColorContrast = () => {
    // Test some common color combinations
    const tests = [
      { name: 'Primary on Background', fg: [59, 130, 246], bg: [255, 255, 255] }, // Blue on white
      { name: 'Text on Background', fg: [0, 0, 0], bg: [255, 255, 255] }, // Black on white
      { name: 'Muted Text', fg: [107, 114, 128], bg: [255, 255, 255] }, // Gray on white
    ];

    const results = tests.map(test => ({
      ...test,
      ratio: ColorContrast.getContrastRatio(test.fg as [number, number, number], test.bg as [number, number, number]),
      passesAA: ColorContrast.meetsWCAG(test.fg as [number, number, number], test.bg as [number, number, number], 'AA'),
      passesAAA: ColorContrast.meetsWCAG(test.fg as [number, number, number], test.bg as [number, number, number], 'AAA'),
    }));

    console.table(results);
    announceToScreenReader('Color contrast test results logged to console', 'polite');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Accessibility Settings</h2>
        <p className="text-muted-foreground">
          Configure accessibility features and run accessibility audits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
            <CardDescription>
              Adjust accessibility settings for better user experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField>
              <FormLabel htmlFor="font-size">Font Size</FormLabel>
              <AccessibleSelect
                id="font-size"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
              >
                <option value="small">Small (14px)</option>
                <option value="medium">Medium (16px)</option>
                <option value="large">Large (18px)</option>
              </AccessibleSelect>
            </FormField>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">System Preferences</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Reduced Motion:</span>
                  <span className={prefersReducedMotion ? 'text-green-600' : 'text-gray-500'}>
                    {prefersReducedMotion ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High Contrast:</span>
                  <span className={highContrast ? 'text-green-600' : 'text-gray-500'}>
                    {highContrast ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Testing</CardTitle>
            <CardDescription>
              Run automated accessibility audits and tests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <AccessibleButton
                onClick={runAccessibilityAudit}
                loading={isAuditing}
                loadingText="Running audit..."
                className="w-full"
              >
                Run Accessibility Audit
              </AccessibleButton>
              
              <AccessibleButton
                variant="outline"
                onClick={testColorContrast}
                className="w-full"
              >
                Test Color Contrast
              </AccessibleButton>
            </div>

            {auditResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Audit Results</h4>
                <div className="rounded-md border p-3">
                  {auditResults.length === 0 ? (
                    <p className="text-sm text-green-600">
                      ✓ No accessibility issues found
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm text-destructive">
                      {auditResults.map((issue, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">⚠️</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Guidelines</CardTitle>
          <CardDescription>
            Best practices and guidelines for maintaining accessibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">WCAG 2.1 Compliance</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Minimum contrast ratio of 4.5:1 for normal text</li>
                <li>• Minimum contrast ratio of 3:1 for large text</li>
                <li>• All interactive elements must be keyboard accessible</li>
                <li>• Provide alternative text for images</li>
                <li>• Use semantic HTML elements</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Implementation Checklist</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Focus indicators are visible and clear</li>
                <li>• Form fields have proper labels and error messages</li>
                <li>• Screen reader announcements for dynamic content</li>
                <li>• Respect user motion preferences</li>
                <li>• Minimum touch target size of 44px</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
          <CardDescription>
            Available keyboard shortcuts for navigation and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Navigation</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Skip to main content:</dt>
                  <dd className="font-mono">Tab</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Navigate menu items:</dt>
                  <dd className="font-mono">↑ ↓ ← →</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Activate button/link:</dt>
                  <dd className="font-mono">Enter / Space</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Application</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Close modal/dropdown:</dt>
                  <dd className="font-mono">Escape</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Search:</dt>
                  <dd className="font-mono">Ctrl + K</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Help:</dt>
                  <dd className="font-mono">?</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}