import React, { useEffect, useState } from "react";
import adminApi, { AdminUserDTO } from "@/api/admin.api";
import { extractErrorMessage } from "@/api/client";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Badge from "@/components/common/Badge";
import { TableSkeleton } from "@/components/common/Skeleton";
import ErrorState from "@/components/common/ErrorState";
import { Edit2, Users } from "lucide-react";

const AVAILABLE_ROLES = ["ROLE_USER", "ROLE_SELLER", "ROLE_ADMIN"] as const;

export const AdminUsersPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Roles Modal
  const [selectedUser, setSelectedUser] = useState<AdminUserDTO | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to load users.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEditModal = (u: AdminUserDTO) => {
    setSelectedUser(u);
    setSelectedRoles([...(u.roles || [])]);
    setIsModalOpen(true);
  };

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedRoles.length === 0) {
      dispatch(addToast({ type: "error", message: "User must have at least one role." }));
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.updateUserRoles(selectedUser.userId, selectedRoles);
      dispatch(
        addToast({
          type: "success",
          message: `Roles for "${selectedUser.userName}" updated successfully!`,
        })
      );
      setIsModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to update user roles.");
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ROLE_ADMIN":
        return <Badge variant="warning">ADMIN</Badge>;
      case "ROLE_SELLER":
        return <Badge variant="info">SELLER</Badge>;
      default:
        return <Badge variant="neutral">CUSTOMER</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          User & Access Control Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View registered customer and merchant accounts, manage roles and permissions across Angadi
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No registered users found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold text-slate-900">
                Registered Accounts ({users.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">User ID</th>
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Assigned Roles</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">#{u.userId}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{u.userName}</td>
                    <td className="py-4 px-6 text-slate-600 truncate max-w-xs">{u.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => <span key={r}>{getRoleBadge(r)}</span>)
                        ) : (
                          <Badge variant="neutral">CUSTOMER</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-amber-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Manage user roles"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Roles</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Roles Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? `Manage Roles: ${selectedUser.userName}` : "Manage Roles"}
        maxWidth="sm"
      >
        {selectedUser && (
          <form onSubmit={handleSaveRoles} className="space-y-5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">
                <strong className="text-slate-900">Email:</strong> {selectedUser.email}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900">User ID:</strong> #{selectedUser.userId}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Assign System Roles
              </label>
              <div className="space-y-2">
                {AVAILABLE_ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-amber-50/60 border-amber-300 text-slate-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRole(role)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-xs block">
                          {role === "ROLE_ADMIN"
                            ? "Administrator (Full Access)"
                            : role === "ROLE_SELLER"
                            ? "Merchant / Seller (Catalog Access)"
                            : "Customer (Standard Shopping)"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{role}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Update Roles
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
