import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirma tu pedido en Mundo Celular",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
