// filepath: d:/projects/Hearline Webapp/landing-website/src/app/api/subscription/cancel/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Assuming authOptions are defined here
// import { prisma } from "@/lib/prisma"; // Assuming you use Prisma

// Mock database or service
let mockSubscriptions = [
  { id: "sub_123", userId: "user_abc", status: "ACTIVE", plan: "premium" },
  { id: "sub_456", userId: "user_def", status: "ACTIVE", plan: "basic" },
  { id: "cmbp4g6ew0002zw85nyekyls9", userId: "user_xyz", status: "ACTIVE", plan: "enterprise" } // Added the test subscription ID
];

export async function POST(request: Request) {
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  // const userId = session.user.id; // Or however you get the user ID

  try {
    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Simulate finding and updating the subscription in a database
    const subscriptionIndex = mockSubscriptions.findIndex(sub => sub.id === subscriptionId /* && sub.userId === userId */);

    if (subscriptionIndex === -1) {
      return NextResponse.json({ error: "Subscription not found or access denied" }, { status: 404 });
    }

    if (mockSubscriptions[subscriptionIndex].status === "CANCELLED") {
      return NextResponse.json({ message: "Subscription is already cancelled." }, { status: 200 });
    }

    // Simulate cancellation
    mockSubscriptions[subscriptionIndex].status = "CANCELLED";
    
    // Log the cancellation reason (in a real app, save this to your DB)
    console.log(`Subscription ${subscriptionId} cancelled by user. Reason: ${reason || 'No reason provided'}`);

    // In a real application, you would interact with your database (e.g., Prisma)
    // and potentially a payment gateway (Stripe, PayPal) to actually cancel the subscription.
    // Example with Prisma (conceptual):
    // const updatedSubscription = await prisma.subscription.update({
    //   where: { id: subscriptionId, userId: userId },
    //   data: { 
    //     status: 'CANCELLED', 
    //     cancelledAt: new Date(),
    //     cancellationReason: reason 
    //   },
    // });
    // if (!updatedSubscription) {
    //   return NextResponse.json({ error: "Failed to update subscription in database" }, { status: 500 });
    // }
    
    // await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
    // Or: await stripe.subscriptions.del(stripeSubscriptionId);

    return NextResponse.json({ message: "Subscription cancelled successfully. Access will remain until the end of the current billing period." });

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
