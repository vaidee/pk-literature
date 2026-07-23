"use client";

import { Input, Label } from "@pk-literature/ui";

export interface AddressFormValue {
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export const EMPTY_ADDRESS: AddressFormValue = {
  recipientName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  phone: "",
};

// Shared controlled fieldset — used by both the checkout shipping/
// billing forms and the account address-book form, so the two never
// drift on which fields exist or how they're labeled.
export function AddressFormFields({
  value,
  onChange,
  idPrefix,
}: {
  value: AddressFormValue;
  onChange: (value: AddressFormValue) => void;
  idPrefix: string;
}) {
  function set<K extends keyof AddressFormValue>(key: K, fieldValue: AddressFormValue[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-recipientName`}>Recipient name</Label>
        <Input
          id={`${idPrefix}-recipientName`}
          required
          value={value.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-line1`}>Address line 1</Label>
        <Input id={`${idPrefix}-line1`} required value={value.line1} onChange={(e) => set("line1", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-line2`}>Address line 2 (optional)</Label>
        <Input id={`${idPrefix}-line2`} value={value.line2} onChange={(e) => set("line2", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-city`}>City</Label>
        <Input id={`${idPrefix}-city`} required value={value.city} onChange={(e) => set("city", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <Input id={`${idPrefix}-state`} required value={value.state} onChange={(e) => set("state", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-postalCode`}>Postal code</Label>
        <Input
          id={`${idPrefix}-postalCode`}
          required
          value={value.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-country`}>Country</Label>
        <Input
          id={`${idPrefix}-country`}
          required
          maxLength={2}
          value={value.country}
          onChange={(e) => set("country", e.target.value.toUpperCase())}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
        <Input id={`${idPrefix}-phone`} required value={value.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
    </div>
  );
}
