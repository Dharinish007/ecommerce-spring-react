import React, { useEffect, useState } from "react";
import addressApi from "@/api/address.api";
import { AddressDTO } from "@/types/address.types";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { MapPin, Plus, Edit2, Trash2, Home } from "lucide-react";

export const AddressesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressDTO>({
    street: "",
    buildingName: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressApi.getUserAddresses();
      setAddresses(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load saved addresses.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddressId(null);
    setFormData({
      street: "",
      buildingName: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressDTO) => {
    setEditingAddressId(addr.addressId || null);
    setFormData({ ...addr });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.street.trim() || formData.street.length < 5) {
      errs.street = "Street must be at least 5 characters";
    }
    if (!formData.buildingName.trim() || formData.buildingName.length < 5) {
      errs.buildingName = "Building name must be at least 5 characters";
    }
    if (!formData.city.trim() || formData.city.length < 4) {
      errs.city = "City must be at least 4 characters";
    }
    if (!formData.state.trim() || formData.state.length < 2) {
      errs.state = "State must be at least 2 characters";
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = "Pincode must be exactly 6 digits";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, formData);
        dispatch(addToast({ type: "success", message: "Address updated successfully!" }));
      } else {
        await addressApi.createAddress(formData);
        dispatch(addToast({ type: "success", message: "New address added successfully!" }));
      }
      setIsModalOpen(false);
      loadAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address.";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId?: number) => {
    if (!addressId) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      await addressApi.deleteAddress(addressId);
      dispatch(addToast({ type: "info", message: "Address removed." }));
      loadAddresses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete address.";
      dispatch(addToast({ type: "error", message: msg }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-1.5">
        <a href="/" className="hover:text-slate-900 transition-colors">Home</a>
        <span>/</span>
        <a href="/account/profile" className="hover:text-slate-900 transition-colors">Account</a>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Addresses</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Delivery Addresses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your saved residential and commercial delivery locations
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Address
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAddresses} />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No delivery addresses saved"
          description="Save your home, apartment, or office delivery address for fast 1-click checkout across Angadi."
          icon={<MapPin className="w-8 h-8 text-slate-400" />}
          actionLabel="Add First Address"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.addressId}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Home className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{addr.buildingName}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{addr.street}</p>
                <p className="text-xs text-slate-600 font-medium">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">{addr.country}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(addr)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-amber-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr.addressId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <Input
            label="Flat / House / Building Name"
            required
            value={formData.buildingName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, buildingName: e.target.value }))
            }
            placeholder="e.g. Flat 402, Shanti Heights"
            error={formErrors.buildingName}
          />

          <Input
            label="Street Address / Area / Locality"
            required
            value={formData.street}
            onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
            placeholder="e.g. 14th Main, HSR Layout, Sector 2"
            error={formErrors.street}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. Bengaluru"
              error={formErrors.city}
            />

            <Input
              label="State"
              required
              value={formData.state}
              onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="e.g. Karnataka"
              error={formErrors.state}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="6-Digit PIN Code"
              required
              value={formData.pincode}
              onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 560102"
              error={formErrors.pincode}
            />

            <Input
              label="Country"
              required
              value={formData.country}
              onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="e.g. India"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingAddressId ? "Update Address" : "Save Address"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddressesPage;
