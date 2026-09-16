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
  QrCode,
} from "lucide-react";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart, isLoading: isCartLoading } = useAppSelector((state) => state.cart);

  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
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
    country: "India",
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
    if (!newAddress.buildingName.trim() || newAddress.buildingName.length < 3) {
      errs.buildingName = "Building/Flat name must be at least 3 characters";
    }
    if (!newAddress.street.trim() || newAddress.street.length < 4) {
      errs.street = "Street address must be at least 4 characters";
    }
    if (!newAddress.city.trim() || newAddress.city.length < 3) {
      errs.city = "City must be at least 3 characters";
    }
    if (!newAddress.state.trim() || newAddress.state.length < 2) {
      errs.state = "State is required";
    }
    if (!newAddress.pincode.trim() || !/^\d{6}$/.test(newAddress.pincode.trim())) {
      errs.pincode = "Please enter a valid 6-digit PIN code";
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddress()) return;

    setIsSavingAddress(true);
    try {
      const created = await addressApi.createAddress(newAddress);
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.addressId || null);
      setIsAddressModalOpen(false);
      setNewAddress({
        street: "",
        buildingName: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      });
      dispatch(
        addToast({
          type: "success",
          message: "Delivery address added successfully.",
        })
      );
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
      setOrderError("Please select or add a delivery address to continue.");
      return;
    }

    if (!cart || !cart.products || cart.products.length === 0) {
      setOrderError("Your cart is empty. Please add items before checking out.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderRequest: OrderRequestDTO = {
        addressId: selectedAddressId,
        paymentMethod,
        pgName: paymentMethod === "COD" ? "Cash On Delivery" : "Angadi Pay",
        pgPaymentId: `ANGADI-TXN-${Date.now()}`,
        pgStatus: "SUCCESS",
        pgResponseMessage: "Payment confirmed successfully",
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
      const msg =
        err instanceof Error ? err.message : "Failed to place order. Please review item stock.";
      setOrderError(msg);
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const products = cart?.products || [];
  const totalPrice = cart?.totalPrice || 0;
  const isFreeShipping = totalPrice >= 499;
  const shippingFee = isFreeShipping ? 0 : 49;
  const grandTotal = totalPrice + shippingFee;

  if (isCartLoading || isAddressesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-1 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Checkout &amp; Place Order
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select delivery location, choose payment mode, and complete your order
        </p>
      </div>

      {orderError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to process order</p>
            <p className="mt-0.5">{orderError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Delivery Address
                </h2>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl space-y-3">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-700">No saved address found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Please provide an address where we can deliver your order.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Address Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.addressId;
                  return (
                    <div
                      key={addr.addressId}
                      onClick={() => addr.addressId && setSelectedAddressId(addr.addressId)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            {addr.buildingName}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{addr.street}</p>
                        <p className="text-xs text-slate-600">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                          {addr.country}
                        </p>
                      </div>

                      <div className="pt-2 text-[11px] font-bold text-amber-700">
                        {isSelected ? "Delivering Here" : "Deliver to this address"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                  paymentMethod === "COD"
                    ? "border-amber-500 bg-amber-50/50 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Cash on Delivery</span>
                <span className="text-[10px] text-slate-500">Pay when order arrives</span>
              </div>

              {/* Option 2: UPI */}
              <div
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                  paymentMethod === "UPI"
                    ? "border-amber-500 bg-amber-50/50 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <QrCode className="w-6 h-6 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">UPI / QR Code</span>
                <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
              </div>

              {/* Option 3: Card */}
              <div
                onClick={() => setPaymentMethod("Credit Card")}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                  paymentMethod === "Credit Card"
                    ? "border-amber-500 bg-amber-50/50 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <CreditCard className="w-6 h-6 text-slate-800" />
                <span className="text-xs font-bold text-slate-900">Credit / Debit Card</span>
                <span className="text-[10px] text-slate-500">Visa, Mastercard, RuPay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Review & Submission */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({products.length} {products.length === 1 ? "item" : "items"})
          </h2>

          {/* Mini Items List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1">
            {products.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center gap-3">
                <img
                  src={resolveProductImageUrl(item.image)}
                  alt={item.productName}
                  onError={handleImageError}
                  className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
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

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total</span>
              <span className="font-semibold text-slate-900">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">
                {isFreeShipping ? "FREE" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode</span>
              <span className="font-bold text-slate-900">{paymentMethod}</span>
            </div>
            <div className="border-t border-slate-100 pt-2.5 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Order Total</span>
              <span className="text-xl font-black text-slate-950">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isPlacingOrder}
            onClick={handlePlaceOrder}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none shadow-xs"
          >
            Confirm &amp; Place Order
          </Button>

          <div className="pt-2 text-[11px] text-slate-500 text-center space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Secure Checkout Guarantee</span>
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
            label="Flat / House / Building Name"
            required
            value={newAddress.buildingName}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, buildingName: e.target.value }))
            }
            placeholder="e.g. Flat 302, Green Glen Residency"
            error={addressErrors.buildingName}
          />

          <Input
            label="Street Address / Area / Locality"
            required
            value={newAddress.street}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, street: e.target.value }))}
            placeholder="e.g. 100 Feet Ring Road, Indiranagar"
            error={addressErrors.street}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              value={newAddress.city}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. Bengaluru"
              error={addressErrors.city}
            />

            <Input
              label="State"
              required
              value={newAddress.state}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="e.g. Karnataka"
              error={addressErrors.state}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="6-Digit PIN Code"
              required
              value={newAddress.pincode}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 560038"
              error={addressErrors.pincode}
            />

            <Input
              label="Country"
              required
              value={newAddress.country}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="India"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingAddress}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none"
            >
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
