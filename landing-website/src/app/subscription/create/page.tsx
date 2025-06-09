'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CreateSubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [simulatePayment, setSimulatePayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

  const handleSimulatePaymentChange = (checked: boolean) => {
    setSimulatePayment(checked)
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a subscription plan",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          simulatePayment
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription created successfully"
        })
        router.push('/dashboard/subscription')
      } else {
        throw new Error(result.message || 'Failed to create subscription')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Subscription</h1>
          <p className="text-muted-foreground">
            Set up your subscription to access premium features.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="simulate-payment">Payment Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="simulate-payment"
                  checked={simulatePayment}
                  onCheckedChange={handleSimulatePaymentChange}
                />
                <Label htmlFor="simulate-payment">
                  Simulate payment processing (for testing)
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateSubscription} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}