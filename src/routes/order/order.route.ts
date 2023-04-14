import express, { Response } from "express";
import { authGuard } from "../../jwt/jwt.strategy";
import { checkValidationErrors } from "../../validation/validation.errors";
import { Destination } from "../../entities/destination.entity";
import {
  ERR_DESTINATION_NOT_ALLOWED_TO_ORDER,
  ERR_NOT_FOUND_DESTINATIONS,
  ERR_NOT_FOUND_ORDER,
  ERR_ORDER_ALREADY_REFUNDED,
  ERR_PAYMENT,
} from "../../commons/errors/errors-codes";
import { AppError } from "../../commons/errors/app-error";
import { User } from "../../entities/user.entity";
import { Stripe } from "stripe";
import { GetUser } from "../../decorator/get-user.decorator";
import { Order } from "../../entities/order.entity";
import { Status } from "../../commons/enums/status.enum";
import { Refund } from "../../entities/refund.entity";
import { StripeIntent } from "../../entities/stripe-intent.entity";

const router = express.Router();
export let stripe: Stripe;
router.use((req, res, next) => {
  stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });
  next();
});
router.post(
  "/api/stripe/create_checkout",
  authGuard,
  checkValidationErrors,
  async (req, res) => {
    const { destinationId, successUrl, cancelUrl } = req.body;
    const user = await GetUser(req);
    const destination = await Destination.findOneBy({ id: destinationId });
    if (!destination) return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));

    try {
      const session = await _getStripeSession(
        destination,
        user,
        successUrl,
        cancelUrl,
        res
      );
      if (!session) {
      } else {
        const publishable_key = (await process.env
          .STRIPE_PUBLISHABLE_KEY) as string;

        return res.json({
          stripe_publishable_key: publishable_key,
          stripe_session_id: session.id,
        });
      }
    } catch (e) {
      console.log(e);
      return res.json(new AppError("ERR", "invalid payment"));
    }
  }
);

async function _getStripeSession(
  destination: Destination,
  user: User,
  success_url: string,
  cancel_url: string,
  res: Response
) {
  try {
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: destination.price * 100,
      product_data: { name: destination.title },
    });
    return await stripe.checkout.sessions.create({
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        destinationId: destination.id,
        user_id: user.id,
        description: destination.description,
        price: destination.price,
        currency: "usd",
      },
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
    });
  } catch (e) {
    res.json(new AppError("INVALID_CHECKOUT"));
  }
}

async function _getCustomerId(user: User) {
  if (user.customerId) {
    return user.customerId;
  } else {
    const customer = await stripe.customers.create({
      name: user.fullName,
      email: user.email,
    });
    return customer.id;
  }
}

router.post("webhook", async (req, res) => {
  const body = req.body;
  await handleWebhook(body, res);
});
async function handleWebhook(body: any, res: Response): Promise<void> {
  const type = body.type;
  const result = body.data.object;
  if (!result) res.json(new AppError("InternalServerErrorException"));

  switch (type) {
    case "checkout.session.completed":
      await _handleCheckoutSessionCompleted(result, res);
      break;
    case "payment_intent.failed":
      break;
    case "payment_intent.amount_capturable_updated":
      await _handlePaymentIntentAmountCapturableUpdated(result, res);
      break;
    case "setup_intent.succeeded":
      await _handleSetupIntentSucceeded(result, stripe, res);
      break;
    default:
  }
  async function _handleCheckoutSessionCompleted(result: any, res: Response) {
    const destination_id = result.metadata.destination_id;
    const user_id = result.metadata.user_id;
    const paymentIntent = result.payment_intent;
    const destination = await Destination.findOne({
      where: { id: destination_id },
    });
    const user = await User.findOne({ where: { id: user_id } });
    const order = Order.create({
      destination,
      user,
      paymentIntent,
      status: Status.PAID,
    });
    await Order.save(order);
  }
}

router.post("/api/stripe/free_order", authGuard, async (req, res) => {
  const { destinationId } = req.body;
  const user = await GetUser(req);
  const destination = await Destination.findOne({
    where: { id: destinationId },
  });
  if (!destination) return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
  const order = Order.create({
    user,
    destination,
  });
  destination.joinedNumberParticipants =
    destination.joinedNumberParticipants + 1;
  await Destination.save(destination);
  order.destination = destination;
  order.status = Status.FREE_ORDER;
  await Order.save(order);
  res.json();
});
router.post(
  "/api/stripe/refund",
  checkValidationErrors,
  authGuard,
  async (req, res) => {
    const { orderId, reason } = req.body;
    const user = await GetUser(req);
    const order = await Order.findOne({
      relations: { user: true, destination: true },
      where: {
        id: orderId,
        user: {
          id: user.id,
        },
      },
    });
    if (!order) {
      return res.json(new AppError(ERR_NOT_FOUND_ORDER));
    }

    await _checkOrderRefund(order, reason, res);
  }
);
async function _checkOrderRefund(order: Order, reason: string, res: Response) {
  if (order.status == Status.REFUNDED) {
    return res.json(new AppError(ERR_ORDER_ALREADY_REFUNDED));
  }
  if (order.status == Status.FREE_ORDER) {
    const refund = await Refund.create({ reason });
    await Refund.save(refund);
    order.status = Status.REFUNDED;
    await Order.save(order);
    return res.json();
  }

  if (order.status == Status.PAID) {
    try {
      await stripe.refunds.create({
        payment_intent: order.paymentIntent,
        reason: "requested_by_customer",
      });
    } catch (e) {
      res.json(new AppError("ERR", "Payment_failed"));
    }
    const refund = await Refund.create({ reason });
    await Refund.save(refund);
    order.status = Status.REFUNDED;
    await Order.save(order);
    return res.json();
  }
}

/// PAYMENT INTENT
async function _handlePaymentIntentAmountCapturableUpdated(
  result: any,
  res: Response
) {
  const { destinationId, userId } = result.metadata;
  const paymentIntent: string = result.id;

  // add paymentIntent DB
  const stripeIntent = StripeIntent.create({
    paymentIntent,
    destination: { id: destinationId },
    user: { id: userId },
  });
  await StripeIntent.save(stripeIntent);

  await _checkToCharge(res, paymentIntent, null, destinationId, userId);
}
async function _handleSetupIntentSucceeded(
  result: any,
  stripe: Stripe,
  res: Response
) {
  const { destinationId, userId } = result.metadata;
  const setupIntent: string = result.id;

  // add setupIntent DB
  const stripeIntent = StripeIntent.create({
    setupIntent,
    destination: { id: destinationId },
    user: { id: userId },
  });
  await StripeIntent.save(stripeIntent);

  await _checkToCharge(res, null, setupIntent, destinationId, userId);
}
async function _checkToCharge(
  res: Response,
  paymentIntent?: string,
  setupIntent?: string,
  destinationId?: string,
  userId?: string
) {
  if (!destinationId || !userId) return;
  const destination = await Destination.findOne({
    where: { id: destinationId },
  });
  if (!destination) return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));
  if (destination.isMinParticipantsAttended) {
    if (
      destination.joinedNumberParticipants ==
      destination.requiredNumberTravelers
    ) {
      // conditions satisfied NOW
      // TODO: charge all intent in table
      await _chargeAllOrdersByDestinationId(destination, userId);
    } else {
      // conditions satisfied already before
      // TODO: charge instantly
      if (paymentIntent) {
        await stripe.paymentIntents.capture(paymentIntent);
      } else if (setupIntent) {
        await _chargeOrderBySetupIntent(setupIntent, destination, userId);
      }
    }
  }
}
async function _chargeAllOrdersByDestinationId(
  destination: Destination,
  userId: string
) {
  const stripeIntents = await StripeIntent.find({
    where: {
      destination: {
        id: destination.id,
      },
    },
  });

  stripeIntents.forEach((stripeIntent) => {
    if (stripeIntent.paymentIntent) {
      stripe.paymentIntents.capture(stripeIntent.paymentIntent);
    } else if (stripeIntent.setupIntent) {
      _chargeOrderBySetupIntent(stripeIntent.setupIntent, destination, userId);
    }
  });
}
async function _chargeOrderBySetupIntent(
  setupIntent: string,
  destination: Destination,
  userId: string
) {
  const setupIntentData = await stripe.setupIntents.retrieve(setupIntent);
  const paymentMethodId = _getPaymentMethodId(setupIntentData.payment_method);
  const amount = parseInt(`${destination.price * 100}`);
  const paymentIntent = await stripe.paymentIntents.create({
    payment_method: paymentMethodId,
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
    capture_method: "manual",
    metadata: {
      destinationId: destination.id,
      userId: userId,
    },
  });

  await stripe.paymentIntents.capture(paymentIntent.id);
}
function _getPaymentMethodId(paymentMethod: string | Stripe.PaymentMethod) {
  if (typeof paymentMethod == "string") {
    return paymentMethod;
  } else {
    paymentMethod.id;
  }
}

router.post("/api/stripe/create_payment", authGuard, async (req, res) => {
  // check if Destination allowed to order
  const { destinationId } = req.body;
  const user = await GetUser(req);
  const destination = await Destination.findOne({
    where: { id: destinationId },
  });
  if (!destination) return res.json(new AppError(ERR_NOT_FOUND_DESTINATIONS));

  if (!destination.isAllowedToOrder)
    return res.json(new AppError(ERR_DESTINATION_NOT_ALLOWED_TO_ORDER));
  let paymentIntent = await _placeOnHoldPayment(destination, user, res);
  let setupIntent = await _setupFuturePayment(destination, user, res);

  return res.json({
    paymentIntent: paymentIntent,
    setupIntent: setupIntent,
  });
});
// todo place on hold
async function _placeOnHoldPayment(
  destination: Destination,
  user: User,
  res: Response
): Promise<String> {
  try {
    const amount = parseInt(`${destination.price * 100}`);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: `usd`,
      payment_method_types: ["card"],
      capture_method: "manual",
      metadata: {
        destinationId: destination.id,
        userId: user.id,
      },
    });
    // return paymentIntent client_secret;
    return paymentIntent.client_secret;
  } catch (e) {
    res.json(new AppError(ERR_PAYMENT));
  }
}
// todo setup future payment
async function _setupFuturePayment(
  destination: Destination,
  user: User,
  res: Response
) {
  try {
    const customer = await _getCustomerId(user);
    const setupIntent = await stripe.setupIntents.create({
      customer: customer,
      payment_method_types: ["bancontact", "card", "ideal"],
      metadata: {
        destinationId: destination.id,
        userId: user.id,
      },
    });

    return setupIntent.client_secret;
  } catch (e) {
    res.json(new AppError(ERR_PAYMENT));
  }
}

export { router as orderRoute };
