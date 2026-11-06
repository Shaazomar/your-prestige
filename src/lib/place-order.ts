"use client";

import {
  buildOrderMessage,
  buildWhatsAppLink,
  type OrderLine,
} from "@/lib/whatsapp-message";

export interface PlaceOrderItem {
  productId: string;
  variantId?: string | null;
  size?: string | null;
  quantity: number;
  unit: string;
  fallback: OrderLine;
}

export interface PlaceOrderResult {
  saved: boolean;
  orderNumber?: string;
  error?: string;
}

/**
 * Who placed the order. Optional so existing callers keep working, but the
 * enquiry drawer now always supplies at least a phone number — without one a
 * saved order cannot be followed up if the customer never sends the prepared
 * WhatsApp message. `createOrder` validates all three server-side.
 */
export interface PlaceOrderCustomer {
  name?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export async function placeWhatsAppOrder(
  items: PlaceOrderItem[],
  whatsappNumber: string,
  customer?: PlaceOrderCustomer
): Promise<PlaceOrderResult> {
  // Prepare a fallback link in case saving the order fails.
  const fallbackUrl = buildWhatsAppLink(
    whatsappNumber,
    buildOrderMessage(items.map((item) => item.fallback))
  );

  // Open exactly one blank tab during the user's click.
  // This preserves the browser's permission to open a new tab.
  const popup = window.open("about:blank", "_blank");

  // Keep the original product page in the current tab.
  if (popup) {
    popup.opener = null;
  }

  const openWhatsApp = (url: string) => {
    if (popup && !popup.closed) {
      popup.location.href = url;
    } else {
      // If the browser blocks popups, do not redirect the product page.
      // Show the WhatsApp link as an error instead.
      return false;
    }

    return true;
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map(
          ({ productId, variantId, size, quantity, unit }) => ({
            productId,
            variantId: variantId || null,
            size: size || null,
            quantity,
            unit,
          })
        ),
        customerName: customer?.name?.trim() || null,
        customerPhone: customer?.phone?.trim() || null,
        notes: customer?.notes?.trim() || null,
        sourcePage: window.location.pathname,
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.whatsappUrl) {
      const opened = openWhatsApp(data.whatsappUrl);

      if (!opened) {
        return {
          saved: true,
          orderNumber: data.orderNumber,
          error:
            "Your order was saved, but the browser blocked the WhatsApp tab. Allow popups and try opening WhatsApp again.",
        };
      }

      return {
        saved: true,
        orderNumber: data.orderNumber,
      };
    }

    // The server rejected the order. `fallbackUrl` was prepared for exactly
    // this case but was never used, so a database hiccup left the customer
    // with an error and no way through — on a site whose entire checkout is
    // "continue on WhatsApp". Hand them the prepared message instead.
    //
    // It deliberately carries no order reference, because no order was
    // saved: per the brief, opening WhatsApp is not a confirmed order. The
    // enquiry simply arrives as a chat the showroom answers by hand.
    if (openWhatsApp(fallbackUrl)) {
      return {
        saved: false,
        error:
          "We couldn't save your order, so it hasn't been recorded — but your message is ready on WhatsApp and we'll pick it up there.",
      };
    }

    if (popup && !popup.closed) {
      popup.close();
    }

    return {
      saved: false,
      error:
        data?.error ||
        "Could not save your order. Please refresh and try again.",
    };
  } catch {
    // Network or parse failure — same reasoning as above.
    if (openWhatsApp(fallbackUrl)) {
      return {
        saved: false,
        error:
          "We couldn't reach our server, so your order hasn't been recorded — but your message is ready on WhatsApp.",
      };
    }

    if (popup && !popup.closed) {
      popup.close();
    }

    return {
      saved: false,
      error:
        "Could not save your order. Please check your connection and try again.",
    };
  }
}