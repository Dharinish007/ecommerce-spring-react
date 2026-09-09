import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCart, clearCartState } from "@/store/slices/cartSlice";
import { addToast } from "@/store/slices/uiSlice";
import addressApi from "@/api/address.api";
import ordersApi from "@/api/orders.api";
import { AddressDTO } from "@/types/address.types";
import { OrderRequestDTO } from "@/types/order.types";
import { formatPrice } from "@/utils/formatters";
import { resolveProductImageUrl, handleImageError } from "@/utils/imageUtils";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import {
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart, isLoading: isCartLoading } = useAppSelector((state) => state.cart);

  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card");
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Address creation modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressDTO>({
    street: "",
    buildingName: "",
    city: "",
    state: "",
    country: "USA",
    pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState<{ [key: string]: string }>({});

  const loadAddresses = useCallback(async () => {
    setIsAddressesLoading(true);
    try {
      const data = await addressApi.getUserAddresses();
      setAddresses(data);
      if (data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(data[0].addressId || null);
      }
    } catch {
      setAddresses([]);
    } finally {
      setIsAddressesLoading(false);
    }
  }, [selectedAddressId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout");
      return;
    }
    dispatch(fetchCart());
    loadAddresses();
  }, [isAuthenticated, navigate, dispatch, loadAddresses]);

  const validateAddress = () => {
    const errs: { [key: string]: string } = {};
    if (!newAddress.street.trim() || newAddress.street.length < 5) {
      errs.street = "Street must be at least 5 characters";
    }
    if (!newAddress.buildingName.trim() || newAddress.buildingName.length < 5) {
      errs.buildingName = "Building name must be at least 5 characters";
    }
    if (!newAddress.city.trim() || newAddress.city.length < 4) {
      errs.city = "City must be at least 4 characters";
    }
    if (!newAddress.state.trim() || newAddress.state.length < 2) {
      errs.state = "State must be at least 2 characters";
    }
    if (!newAddress.pincode.trim() || !/^\d{6}$/.test(newAddress.pincode.trim())) {
      errs.pincode = "Pincode must be exactly 6 digits";
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddress()) return;

    setIsSavingAddress(true);
    try {
      const saved = await addressApi.createAddress(newAddress);
      dispatch(addToast({ type: "success", message: "Delivery address added successfully!" }));
      setIsAddressModalOpen(false);
      setNewAddress({
        street: "",
        buildingName: "",
        city: "",
        state: "",
        country: "USA",
        pincode: "",
      });
      await loadAddresses();
      if (saved.addressId) {
        setSelectedAddressId(saved.addressId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    if (!selectedAddressId) {
      setOrderError("Please select or add a delivery address.");
      return;
    }

    if (!cart || !cart.products || cart.products.length === 0) {
      setOrderError("Your cart is empty. Please add products before checking out.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderRequest: OrderRequestDTO = {
        addressId: selectedAddressId,
        paymentMethod,
        pgName: paymentMethod === "COD" ? "Cash On Delivery" : "Apex Gateway",
        pgPaymentId: `TXN-${Date.now()}`,
        pgStatus: "SUCCESS",
        pgResponseMessage: "Payment processed successfully",
      };

      const order = await ordersApi.placeOrder(paymentMethod, orderRequest);

      // Clear cart locally
      dispatch(clearCartState());
      dispatch(
        addToast({
          type: "success",
          message: `Order #${order.orderId} placed successfully!`,
        })
      );

      navigate(`/order-success/${order.orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order. Please check stock.";
      setOrderError(msg);
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const products = cart?.products || [];
  const totalPrice = cart?.totalPrice || 0;
  const isFreeShipping = totalPrice >= 50;
  const shippingFee = isFreeShipping ? 0 : 9.99;
  const grandTotal = totalPrice + shippingFee;

  if (isCartLoading || isAddressesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Checkout &amp; Order Placement
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select your delivery address and preferred payment method
        </p>
      </div>

      {orderError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold">Unable to process order</h4>
            <p className="leading-relaxed">{orderError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Select Delivery Address
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddressModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Address
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600">No delivery address saved yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  Create Your First Address
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.addressId;
                  return (
                    <div
                      key={addr.addressId}
                      onClick={() => setSelectedAddressId(addr.addressId || null)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-50/40 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {addr.buildingName}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{addr.street}</p>
                        <p className="text-xs text-slate-600">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">{addr.country}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Card */}
              <div
                onClick={() => setPaymentMethod("Credit Card")}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                  paymentMethod === "Credit Card"
                    ? "border-cyan-600 bg-cyan-50/40 text-cyan-900 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <CreditCard className="w-6 h-6 text-cyan-600" />
                <span className="text-xs font-bold">Credit / Debit Card</span>
                <span className="text-[10px] text-slate-400">Instant Verification</span>
              </div>

              {/* Option 2: Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                  paymentMethod === "COD"
                    ? "border-cyan-600 bg-cyan-50/40 text-cyan-900 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold">Cash On Delivery</span>
                <span className="text-[10px] text-slate-400">Pay upon delivery</span>
              </div>

              {/* Option 3: UPI / Net Banking */}
              <div
                onClick={() => setPaymentMethod("UPI")}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                  paymentMethod === "UPI"
                    ? "border-cyan-600 bg-cyan-50/40 text-cyan-900 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <ShieldCheck className="w-6 h-6 text-cyan-600" />
                <span className="text-xs font-bold">UPI / Instant Pay</span>
                <span className="text-[10px] text-slate-400">Direct Banking QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items & Place Order Summary */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({products.length} items)
          </h2>

          {/* Mini Items List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
            {products.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center gap-3">
                <img
                  src={resolveProductImageUrl(item.image)}
                  alt={item.productName}
                  onError={handleImageError}
                  className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.productName}</p>
                  <p className="text-[11px] text-slate-500">
                    Qty: {item.quantity} ×{" "}
                    {formatPrice(
                      item.specialPrice && item.specialPrice < item.price
                        ? item.specialPrice
                        : item.price
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total</span>
              <span className="font-semibold text-slate-800">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping Fee</span>
              <span className="font-semibold text-slate-800">
                {isFreeShipping ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode</span>
              <span className="font-bold text-cyan-700">{paymentMethod}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-xl font-black text-cyan-700">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isPlacingOrder}
            onClick={handlePlaceOrder}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full shadow-md"
          >
            Confirm &amp; Place Order
          </Button>

          <div className="pt-2 text-[11px] text-slate-400 text-center space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              Automated stock decrement &amp; reservation
            </p>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Delivery Address"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Building / Apartment / House Name"
            required
            value={newAddress.buildingName}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, buildingName: e.target.value }))
            }
            placeholder="e.g. Skyline Tower, Apt 4B"
            error={addressErrors.buildingName}
          />

          <Input
            label="Street Address"
            required
            value={newAddress.street}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, street: e.target.value }))}
            placeholder="e.g. 1044 Tech Park Boulevard"
            error={addressErrors.street}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={newAddress.city}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. San Jose"
              error={addressErrors.city}
            />

            <Input
              label="State"
              required
              value={newAddress.state}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="e.g. CA"
              error={addressErrors.state}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="6-Digit Pincode"
              required
              value={newAddress.pincode}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 951234"
              error={addressErrors.pincode}
            />

            <Input
              label="Country"
              required
              value={newAddress.country}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="e.g. USA"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingAddress}>
              Save &amp; Use Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
