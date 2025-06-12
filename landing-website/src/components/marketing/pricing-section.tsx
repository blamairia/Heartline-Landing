'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Star, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface PricingSectionProps {
  isAuthenticated: boolean;
}

interface BillingFormData {
  firstName: string;
  lastName: string;
  phone: string;
  organization: string;
  address: string;
  city: string;
  wilaya: string;
}

interface SubscriptionPlanFeature {
    maxUsers: number;
    maxPatients: number;
    supportLevel: string;
    maxECGAnalyses: number;
    // Add other potential feature fields if they exist in your API response
    [key: string]: any; // Allows for other dynamic features
}

interface SubscriptionPlan {
  id: string;
  name: string; 
  displayName: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string; 
  features: SubscriptionPlanFeature;
  isPopular: boolean;
  trialDays?: number; 
}

interface SelectedPlanDialogData {
  id: string; 
  displayName: string;
  price: number;
  currency: string;
  billingCycle: string;
}

// Re-add addOns as a static array for now, or it can be fetched if needed.
const staticAddOns = [
  {
    name: 'Advanced Analytics',
    price: 1900,
    description: 'Enhanced reporting and population health insights'
  },
  {
    name: 'Mobile App',
    price: 4900,
    description: 'iOS and Android apps for on-the-go monitoring'
  },
  {
    name: 'Additional Storage',
    price: 2900 ,
    description: 'Extra 1TB of secure cloud storage per month'
  }
];

const additionalPlanFeatures: string[] = [
  "Comprehensive patient record management",
  "Secure data storage (HIPAA/GDPR compliant options)",
  "Automated report generation",
  "Telehealth capabilities (illustrative, may vary by plan)",
  "User role and permission management",
  "Audit trails for critical actions",
  "Regular feature updates and improvements",
  "Access to knowledge base and FAQs"
];

export function PricingSection({ isAuthenticated }: PricingSectionProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planFetchError, setPlanFetchError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanDialogData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<BillingFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    address: '',
    city: '',
    wilaya: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      setPlanFetchError(null);
      try {
        const response = await fetch('/api/subscription/plans');
        const data = await response.json();
        if (response.ok && data.plans) {
          setPlans(data.plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => {
            // Assuming displayOrder exists, otherwise sort by name or price
            const orderA = (a as any).displayOrder || 0;
            const orderB = (b as any).displayOrder || 0;
            return orderA - orderB;
          }));
        } else {
          throw new Error(data.message || 'Failed to fetch subscription plans');
        }
      } catch (error: any) {
        console.error('Error fetching plans:', error);
        setPlanFetchError(error.message || 'Could not load plans. Please try again later.');
        toast({
          title: "Error Loading Plans",
          description: error.message || "Could not load plans. Please try again later.",
          variant: "destructive"
        });
      }
      setLoadingPlans(false);
    };
    fetchPlans();
  }, [toast]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-DZ', { 
      style: 'currency',
      currency: currency || 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatBillingCycle = (cycle: string) => {
    if (!cycle) return '';
    if (cycle.toUpperCase() === 'MONTHLY') return '/month';
    if (cycle.toUpperCase() === 'YEARLY') return '/year';
    return '/' + cycle.toLowerCase();
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const planForDialog: SelectedPlanDialogData = {
      id: plan.id, 
      displayName: plan.displayName,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle
    };
    setSelectedPlan(planForDialog);
    setShowDialog(true);
  };

  const handleFormChange = (field: keyof BillingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitSubscription = async () => {
    if (!selectedPlan) return;

    const requiredFields: (keyof BillingFormData)[] = ['firstName', 'lastName', 'phone', 'address', 'city', 'wilaya'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id, 
          billingAddress: formData
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription created successfully! Redirecting..."
        });
        setShowDialog(false);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.push('/dashboard/billing'); 
        }
      } else {
        throw new Error(result.message || 'Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error Creating Subscription",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlans) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg text-gray-600">Loading plans...</p>
        </div>
      </section>
    );
  }

  if (planFetchError) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-red-600">{planFetchError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible pricing options designed to scale with your practice. 
              {!isAuthenticated && ' Start with a 30-day free trial, no credit card required.'}
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <motion.div
              key={plan.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: plans.indexOf(plan) * 0.1 }}
            >
              <Card className={`h-full relative flex flex-col ${
                plan.isPopular 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-gray-200 shadow-lg'
              } hover:shadow-xl transition-all duration-300`}>
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.displayName}
                  </CardTitle>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-600">{formatBillingCycle(plan.billingCycle)}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 min-h-[3em]">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-grow">
                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Up to {plan.features.maxUsers === -1 ? 'Unlimited' : plan.features.maxUsers} users</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{plan.features.maxECGAnalyses === -1 ? 'Unlimited' : plan.features.maxECGAnalyses} ECG analyses</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{plan.features.maxPatients === -1 ? 'Unlimited' : plan.features.maxPatients} patients</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{plan.features.supportLevel} support</span>
                    </li>
                    {additionalPlanFeatures.map((feature, index) => (
                      <li key={`additional-feature-${plan.id}-${index}`} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Logic based on authentication and plan type (e.g., 'enterprise') */}
                  {plan.name.toLowerCase() === 'enterprise' ? (
                    <Link href='/contact' className="block w-full mt-auto">
                      <Button 
                        className={`w-full ${
                          plan.isPopular 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        size="lg"
                      >
                        Contact Sales
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : isAuthenticated ? (
                    <Button 
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full mt-auto ${
                        plan.isPopular 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      size="lg"
                    >
                      Subscribe Now
                    </Button>
                  ) : (
                    <Link href='/auth/register' className="block w-full mt-auto">
                      <Button 
                        className={`w-full ${
                          plan.isPopular 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        size="lg"
                      >
                        Start Free Trial
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Static Add-ons Section */}
        <div className="text-center mb-16">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-10"
          >
            Optional Add-ons
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-8">
            {staticAddOns.map((addOn, index) => (
              <motion.div
                key={index} // Using index as key for static list
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {addOn.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {addOn.description}
                    </p>
                    <div className="text-2xl font-bold text-gray-900">
                       {formatPrice(addOn.price, 'DZD')} <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Static FAQ Section (example) */}
        <div className="max-w-4xl mx-auto">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl font-bold text-gray-900 text-center mb-10"
          >
            Frequently Asked Questions
          </motion.h3>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-md mb-4"
          >
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Can I change my plan later?
            </h4>
            <p className="text-gray-600">
              Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes will be reflected in the next billing cycle.
            </p>
          </motion.div>
          {/* Add more static FAQs as needed */}
        </div>
      </div>

      {/* Subscription Creation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedPlan.displayName}</h3>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(selectedPlan.price, selectedPlan.currency)}
                  <span className="text-sm font-normal text-gray-600">
                    {formatBillingCycle(selectedPlan.billingCycle)}
                  </span>
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Billing Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={formData.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)} placeholder="Enter first name" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={formData.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)} placeholder="Enter last name" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} placeholder="Enter phone number" />
                </div>
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" value={formData.organization} onChange={(e) => handleFormChange('organization', e.target.value)} placeholder="Enter organization name" />
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} placeholder="Enter address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} placeholder="Enter city" />
                  </div>
                  <div>
                    <Label htmlFor="wilaya">Wilaya *</Label>
                    <Input id="wilaya" value={formData.wilaya} onChange={(e) => handleFormChange('wilaya', e.target.value)} placeholder="Enter wilaya" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmitSubscription} disabled={submitting} className="flex-1">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Subscribe Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
