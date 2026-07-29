import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    console.log("Stripe Session:", sessionId);

    // Later you can call your backend to verify payment
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>✅ Payment Successful</h1>
      <p>Your payment has been completed successfully.</p>
    </div>
  );
};

export default PaymentSuccess;