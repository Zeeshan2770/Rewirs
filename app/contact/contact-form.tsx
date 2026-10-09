"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label, Input, FieldError } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ContactForm() {
  const supabase = createClient();
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) nextErrors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (values.message.trim().length < 10) nextErrors.message = "Message should be at least 10 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    setStatus("idle");

    // Allowed by the contact_messages_insert_anyone RLS policy - no
    // authentication required to send a message.
    const { error } = await supabase.from("contact_messages").insert({
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    });

    setPending(false);

    if (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    setMessage("Message sent — we'll get back to you soon.");
  }

  if (status === "success") {
    return <Alert variant="success">{message}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === "error" && message && <Alert variant="error">{message}</Alert>}

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <FieldError>{errors.name}</FieldError>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          required
        />
        <FieldError>{errors.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          required
        />
        <FieldError>{errors.message}</FieldError>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
