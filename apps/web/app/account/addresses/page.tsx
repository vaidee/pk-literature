"use client";

import { useEffect, useState } from "react";
import type { SavedAddress } from "@pk-literature/domain-types";
import { Button, Card, CardContent } from "@pk-literature/ui";
import { clientFetch } from "@/lib/api/client-fetch";
import { createAddress, deleteAddress, listAddresses, updateAddress } from "@/lib/api/identity";
import { ApiError } from "@/lib/api/problem-details";
import { AddressFormFields, EMPTY_ADDRESS, type AddressFormValue } from "@/components/address-form-fields";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    listAddresses(clientFetch)
      .then(setAddresses)
      .catch((err) => setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not load addresses."));
  }, []);

  async function onAdd() {
    setPending(true);
    setError(null);
    try {
      const created = await createAddress(clientFetch, { ...newAddress, line2: newAddress.line2 || null, isDefault: false });
      setAddresses((prev) => [...(prev ?? []), created]);
      setAdding(false);
      setNewAddress(EMPTY_ADDRESS);
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not add address.");
    } finally {
      setPending(false);
    }
  }

  async function onSetDefault(address: SavedAddress) {
    setPending(true);
    try {
      const updated = await updateAddress(clientFetch, address.id!, { isDefault: true });
      setAddresses((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : { ...a, isDefault: false })));
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not update default address.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(address: SavedAddress) {
    setPending(true);
    try {
      await deleteAddress(clientFetch, address.id!);
      setAddresses((prev) => (prev ?? []).filter((a) => a.id !== address.id));
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not delete address.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Address book</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {addresses === null ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="text-sm">
                  <p className="font-medium">
                    {address.recipientName} {address.isDefault && <span className="text-xs text-muted-foreground">(default)</span>}
                  </p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  <p>{address.phone}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!address.isDefault && (
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => onSetDefault(address)}>
                      Set default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => onDelete(address)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {adding ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <AddressFormFields value={newAddress} onChange={setNewAddress} idPrefix="new-address" />
            <div className="flex gap-2">
              <Button disabled={pending} onClick={onAdd}>
                Save address
              </Button>
              <Button variant="outline" disabled={pending} onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          Add address
        </Button>
      )}
    </div>
  );
}
